import React from 'react';
import { Layers, Cpu, ShieldCheck, Database, Layout, GitFork, Sparkles, Box } from 'lucide-react';

const techStack = [
  {
    category: 'Frontend',
    icon: Layout,
    tech: 'React 19 + Vite',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    description: 'Ultra-fast Single Page Application (SPA) with 3D declarative UI components.'
  },
  {
    category: 'Styling',
    icon: Layers,
    tech: 'Tailwind CSS',
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    description: 'Modern utility-first CSS framework for clean, responsive, and 3D animated layouts.'
  },
  {
    category: 'Backend',
    icon: Cpu,
    tech: 'Node.js + Express.js',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description: 'Scalable RESTful API server handling business logic, routes, and controllers.'
  },
  {
    category: 'Database',
    icon: Database,
    tech: 'MySQL / SQLite + Sequelize',
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Robust relational database with ORM for secure migrations and queries.'
  },
  {
    category: 'Security / Auth',
    icon: ShieldCheck,
    tech: 'JWT + bcrypt',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description: 'Stateless JSON Web Tokens with password hashing for role-based authorization.'
  },
  {
    category: 'Structure',
    icon: GitFork,
    tech: 'Decoupled Monorepo',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Independent client/ and server/ directories for clean separation of concerns.'
  }
];

const ArchitectureSection = () => {
  return (
    <div id="architecture" className="py-16 animate-fade-up relative">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-700 mb-4 shadow-sm">
          <Box className="w-4 h-4 text-cyan-600 animate-spin" />
          <span>3D Parallax Stack & Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
          Modern & Beginner-Friendly Architecture
        </h2>
        <p className="text-slate-600 mt-4 text-base sm:text-lg leading-relaxed">
          EduSetu is structured with clean separation between client and server, keeping code maintainable, secure, and fully scroll-animated in 3D.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {techStack.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 120}ms` }}
              className="p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-2.5 transition-all duration-500 group animate-fade-up transform-gpu hover:scale-[1.02]"
            >
              <div className="flex items-center space-x-4 mb-5">
                <div className={`p-3.5 rounded-2xl border ${item.color} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-black text-slate-950 group-hover:text-indigo-600 transition-colors">{item.tech}</h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Directory Layout 3D Visual Card */}
      <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl relative overflow-hidden animate-fade-up">
        {/* Background gradient orb */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

        <div className="flex items-center justify-between pb-5 mb-8 border-b border-slate-800/80 relative z-10">
          <span className="font-mono text-sm font-bold text-indigo-400 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shadow-lg shadow-emerald-400" />
            📁 3D Project Directory Map
          </span>
          <span className="text-xs text-slate-400 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800">Independent Client & Server</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs text-slate-300 relative z-10">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800/80 shadow-lg hover:border-emerald-500/50 transition-colors">
            <p className="text-emerald-400 font-bold mb-4 flex items-center gap-2 text-sm">
              <span>client/</span> (React 19 + Vite + Tailwind)
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>├── src/</li>
              <li>│   ├── components/  # 3D Reusable UI elements</li>
              <li>│   ├── pages/       # Screen views & dashboards</li>
              <li>│   ├── services/    # API communication (Axios)</li>
              <li>│   ├── context/     # Auth & app state</li>
              <li>│   └── utils/       # Helper functions</li>
              <li>├── .env.example     # Environment template</li>
              <li>└── vite.config.js   # Vite + Tailwind config</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800/80 shadow-lg hover:border-blue-500/50 transition-colors">
            <p className="text-blue-400 font-bold mb-4 flex items-center gap-2 text-sm">
              <span>server/</span> (Node.js + Express + Sequelize)
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>├── src/</li>
              <li>│   ├── config/      # DB & app configs</li>
              <li>│   ├── controllers/ # Request handlers</li>
              <li>│   ├── middleware/  # Auth & error handling</li>
              <li>│   ├── models/      # Sequelize ORM models</li>
              <li>│   ├── routes/      # REST API endpoints</li>
              <li>│   └── server.js    # Express entrypoint</li>
              <li>└── .env.example     # Environment template</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

exports = module.exports = ArchitectureSection;
