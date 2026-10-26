import React from 'react';
import { Layers, Cpu, ShieldCheck, Database, Layout, GitFork } from 'lucide-react';

const techStack = [
  {
    category: 'Frontend',
    icon: Layout,
    tech: 'React 19 + Vite',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    description: 'Ultra-fast Single Page Application (SPA) with declarative UI components.'
  },
  {
    category: 'Styling',
    icon: Layers,
    tech: 'Tailwind CSS',
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    description: 'Modern utility-first CSS framework for clean, responsive, and mobile-friendly layouts.'
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
    tech: 'MongoDB + Mongoose',
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Document-oriented NoSQL database for flexible data modeling and fast queries.'
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
    <div id="architecture" className="py-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Modern & Beginner-Friendly Architecture
        </h2>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          EduSetu is structured with clean separation between client and server, keeping code maintainable and easy to learn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {techStack.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2.5 rounded-xl border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{item.tech}</h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Directory Layout Visual Card */}
      <div className="mt-8 p-6 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <span className="font-mono text-sm font-semibold text-indigo-400">📁 Project Directory Map</span>
          <span className="text-xs text-slate-400">Independent Client & Server</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-slate-300">
          <div>
            <p className="text-emerald-400 font-semibold mb-2">client/ (React + Vite)</p>
            <ul className="space-y-1 text-slate-400">
              <li>├── src/</li>
              <li>│   ├── components/  # Reusable UI elements</li>
              <li>│   ├── pages/       # Screen views</li>
              <li>│   ├── services/    # API communication (Axios)</li>
              <li>│   ├── context/     # Auth & app state</li>
              <li>│   └── utils/       # Helper functions</li>
              <li>├── .env.example     # Environment template</li>
              <li>└── vite.config.js   # Vite + Tailwind config</li>
            </ul>
          </div>

          <div>
            <p className="text-blue-400 font-semibold mb-2">server/ (Node.js + Express)</p>
            <ul className="space-y-1 text-slate-400">
              <li>├── src/</li>
              <li>│   ├── config/      # DB & app configs</li>
              <li>│   ├── controllers/ # Request handlers</li>
              <li>│   ├── middleware/  # Auth & error handling</li>
              <li>│   ├── models/      # Mongoose schemas</li>
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

export default ArchitectureSection;
