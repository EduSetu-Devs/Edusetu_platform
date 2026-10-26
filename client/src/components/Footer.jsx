import React from 'react';
import { GraduationCap, Heart, Code2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-700">EduSetu</span>
          <span>•</span>
          <span>Education Communication Platform</span>
        </div>

        <div className="flex items-center space-x-1">
          <span>Architected with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>for clean & scalable learning</span>
        </div>

        <div>
          <span>Step 1: Initialization & Architecture Complete</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
