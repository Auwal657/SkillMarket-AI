import { Link } from "wouter";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          <div className="md:col-span-1 lg:col-span-2 text-gray-900">
            <div className="flex items-center gap-2.5 mb-4 group inline-flex">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">S</div>
              <span className="font-bold text-lg tracking-tight">SkillMarket <span className="text-indigo-600">AI</span></span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm">
              The AI-powered freelance marketplace built for students and emerging talent. Find opportunities. Build your career.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Linkedin size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors"><Github size={20} /></a>
              <a href="mailto:hello@skillmarket.ai" className="text-gray-400 hover:text-indigo-600 transition-colors"><Mail size={20} /></a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 tracking-tight">Marketplace</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/projects" className="text-gray-500 hover:text-indigo-600 transition-colors">Browse Projects</Link></li>
              <li><Link href="/freelancers" className="text-gray-500 hover:text-indigo-600 transition-colors">Find Talent</Link></li>
              <li><Link href="/register?role=client" className="text-gray-500 hover:text-indigo-600 transition-colors">Post a Project</Link></li>
              <li><Link href="/register?role=freelancer" className="text-gray-500 hover:text-indigo-600 transition-colors">Join as Freelancer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 tracking-tight">Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/freelancers?skill=React" className="text-gray-500 hover:text-indigo-600 transition-colors">Frontend Dev</Link></li>
              <li><Link href="/freelancers?skill=Node.js" className="text-gray-500 hover:text-indigo-600 transition-colors">Backend Dev</Link></li>
              <li><Link href="/freelancers?skill=UI+%2F+UX+Design" className="text-gray-500 hover:text-indigo-600 transition-colors">UI/UX Design</Link></li>
              <li><Link href="/freelancers?skill=Machine+Learning" className="text-gray-500 hover:text-indigo-600 transition-colors">Data Science</Link></li>
              <li><Link href="/freelancers?skill=Copywriting" className="text-gray-500 hover:text-indigo-600 transition-colors">Content Writing</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} SkillMarket AI. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
