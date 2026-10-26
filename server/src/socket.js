const { Server } = require('socket.io');
const { verifyToken } = require('./utils/tokenHandler');
const { TeachingSession, TeachingSessionParticipant, TeacherProfile, StudentProfile, User, Attendance } = require('./models');

let io = null;

/**
 * Initialize Socket.IO with HTTP server and JWT authentication
 * @param {Object} httpServer - Node.js HTTP Server instance
 * @returns {Object} Socket.IO instance
 */
const initSocket = (httpServer) => {
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!rawToken) {
        return next(new Error('Authentication error: Missing token'));
      }

      const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();
      const decoded = verifyToken(token);

      const userId = decoded?.userId || decoded?.id;
      if (!decoded || !userId) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }

      const activeUser = await User.findByPk(userId, { attributes: ['id', 'name', 'role', 'isActive'] });
      if (!activeUser || !activeUser.isActive || activeUser.role !== decoded.role) {
        return next(new Error('Authentication error: User is not authorized'));
      }

      socket.user = {
        id: activeUser.id,
        role: activeUser.role,
        name: activeUser.name,
        ...decoded
      };
      return next();
    } catch (err) {
      return next(new Error('Authentication error: Token validation failed'));
    }
  });

  // Socket Connection Handling
  io.on('connection', (socket) => {
    const user = socket.user;
    const userRoom = `user_${user.id}`;
    socket.join(userRoom);

    console.log(`[Socket] User connected: ${user.name || 'User'} (ID: ${user.id}, Role: ${user.role}) joined ${userRoom}`);

    socket.emit('authenticated', {
      success: true,
      user: {
        id: user.id,
        role: user.role,
        name: user.name
      },
      room: userRoom
    });

    // Optional heartbeat ping/pong
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    const getAuthorizedClassroom = async (sessionId) => {
      const session = await TeachingSession.findOne({
        where: { id: sessionId, mode: 'ONLINE' },
        include: [
          { model: TeacherProfile, as: 'teacherProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
          { model: StudentProfile, as: 'studentProfile', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }
        ]
      });

      if (!session || !['SCHEDULED', 'LIVE'].includes(session.status) ||
          (session.tutorRequestId && session.bookingStatus !== 'CONFIRMED')) return null;

      const teacherAuthorized = socket.user.role === 'teacher' && session.teacherProfile?.userId === socket.user.id;
      const studentAuthorized = socket.user.role === 'student' && session.studentProfile?.userId === socket.user.id;
      if (!teacherAuthorized && !studentAuthorized) return null;
      return session;
    };

    socket.on('classroom:join', async (payload = {}, acknowledge = () => {}) => {
      try {
        const session = await getAuthorizedClassroom(Number(payload.sessionId));
        if (!session) return acknowledge({ success: false, message: 'Classroom access denied' });
        if (session.status !== 'LIVE') return acknowledge({ success: false, message: 'Class has not started yet' });

        const room = `classroom:${session.id}`;
        socket.join(room);
        socket.data.classroomId = session.id;
        socket.data.classroomRoom = room;
        socket.data.classroomRole = socket.user.role;

        const [participant] = await TeachingSessionParticipant.findOrCreate({
          where: { teachingSessionId: session.id, userId: socket.user.id },
          defaults: { teachingSessionId: session.id, userId: socket.user.id, role: socket.user.role, joinedAt: new Date() }
        });
        await participant.update({ joinedAt: new Date(), leftAt: null });

        if (socket.user.role === 'student') {
          await Attendance.findOrCreate({
            where: {
              studentProfileId: session.studentProfileId,
              date: session.scheduledDate,
              subject: session.subjectName || session.title
            },
            defaults: {
              status: 'present',
              subject: session.subjectName || session.title,
              markedBy: session.teacherProfile?.userId || null,
              remarks: `Online teaching session ${session.id} joined at ${new Date().toISOString()}`
            }
          });
        }

        socket.to(room).emit('classroom:participant-joined', {
          userId: socket.user.id,
          name: socket.user.name || session.studentProfile?.user?.name || session.teacherProfile?.user?.name || 'Participant',
          role: socket.user.role
        });
        return acknowledge({ success: true, sessionId: session.id, room, role: socket.user.role });
      } catch (error) {
        console.error('[Socket Classroom Join Error]:', error.message);
        return acknowledge({ success: false, message: 'Unable to join classroom' });
      }
    });

    socket.on('classroom:leave', () => {
      if (!socket.data.classroomRoom) return;
      socket.to(socket.data.classroomRoom).emit('classroom:participant-left', {
        userId: socket.user.id,
        role: socket.data.classroomRole
      });
      TeachingSessionParticipant.update(
        { leftAt: new Date() },
        { where: { teachingSessionId: socket.data.classroomId, userId: socket.user.id, leftAt: null } }
      ).catch((error) => console.error('[Socket Classroom Leave Error]:', error.message));
      socket.leave(socket.data.classroomRoom);
      socket.data.classroomId = null;
      socket.data.classroomRoom = null;
    });

    const relayToClassroom = (event, payload) => {
      if (!socket.data.classroomRoom) return;
      socket.to(socket.data.classroomRoom).emit(event, payload);
    };

    socket.on('webrtc:offer', (payload) => relayToClassroom('webrtc:offer', payload));
    socket.on('webrtc:answer', (payload) => relayToClassroom('webrtc:answer', payload));
    socket.on('webrtc:ice-candidate', (payload) => relayToClassroom('webrtc:ice-candidate', payload));
    socket.on('classroom:chat-message', (payload = {}) => {
      const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 2000) : '';
      if (!message || !socket.data.classroomRoom) return;
      relayToClassroom('classroom:chat-message', {
        message,
        sender: { userId: socket.user.id, name: socket.user.name || 'Participant', role: socket.user.role },
        createdAt: new Date().toISOString()
      });
    });
    socket.on('classroom:screen-share-started', () => relayToClassroom('classroom:screen-share-started', { userId: socket.user.id }));
    socket.on('classroom:screen-share-stopped', () => relayToClassroom('classroom:screen-share-stopped', { userId: socket.user.id }));

    socket.on('disconnect', (reason) => {
      if (socket.data.classroomRoom) {
        socket.to(socket.data.classroomRoom).emit('classroom:participant-left', {
          userId: socket.user.id,
          role: socket.data.classroomRole
        });
        TeachingSessionParticipant.update(
          { leftAt: new Date() },
          { where: { teachingSessionId: socket.data.classroomId, userId: socket.user.id, leftAt: null } }
        ).catch((error) => console.error('[Socket Classroom Disconnect Error]:', error.message));
      }
      console.log(`[Socket] User disconnected: ID ${user.id} (${reason})`);
    });
  });

  return io;
};

/**
 * Get active Socket.IO instance
 */
const getIO = () => {
  return io;
};

/**
 * Emit event to a specific user's private room safely
 */
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return false;
  try {
    io.to(`user_${userId}`).emit(event, payload);
    return true;
  } catch (err) {
    console.error(`[Socket emitToUser Error]: ${err.message}`);
    return false;
  }
};

/**
 * Emit event to multiple users' private rooms safely
 */
const emitToUsers = (userIds = [], event, payload) => {
  if (!io || !Array.isArray(userIds) || userIds.length === 0) return false;
  try {
    userIds.forEach((uid) => {
      if (uid) io.to(`user_${uid}`).emit(event, payload);
    });
    return true;
  } catch (err) {
    console.error(`[Socket emitToUsers Error]: ${err.message}`);
    return false;
  }
};

const emitToClassroom = (sessionId, event, payload) => {
  if (!io || !sessionId) return false;
  try {
    io.to(`classroom:${sessionId}`).emit(event, payload);
    return true;
  } catch (err) {
    console.error(`[Socket emitToClassroom Error]: ${err.message}`);
    return false;
  }
};

/**
 * Emit new message event to recipient
 */
const emitNewMessage = (recipientUserId, messageData) => {
  return emitNewMessageToIO(io, recipientUserId, messageData);
};

const emitNewMessageToIO = (socketServer, recipientUserId, messageData) => {
  if (!socketServer || !recipientUserId) return false;
  try {
    socketServer.to(`user_${recipientUserId}`).emit('message:new', messageData);
    return true;
  } catch (err) {
    console.error(`[Socket emitNewMessage Error]: ${err.message}`);
    return false;
  }
};

/**
 * Emit new notification event to recipient
 */
const emitNewNotification = (recipientUserId, notificationData) => {
  return emitToUser(recipientUserId, 'notification:new', notificationData);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToUsers,
  emitToClassroom,
  emitNewMessage,
  emitNewMessageToIO,
  emitNewNotification
};
