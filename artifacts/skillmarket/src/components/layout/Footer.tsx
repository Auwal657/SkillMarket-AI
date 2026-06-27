import { Link } from "wouter";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">S</div>
              <span className="font-bold text-white text-lg">SkillMarket <span className="text-indigo-400">AI</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              The AI-powered freelance marketplace built for students and emerging talent. Find opportunities. Build your career.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><Twitter size={16} /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><Linkedin size={16} /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><Github size={16} /></a>
              <a href="mailto:hello@skillmarket.ai" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"><Mail size={16} /></a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/projects" className="hover:text-white transition-colors">Browse Projects</Link></li>
              <li><Link href="/freelancers" className="hover:text-white transition-colors">Find Talent</Link></li>
              <li><Link href="/register?role=client" className="hover:text-white transition-colors">Post a Project</Link></li>
              <li><Link href="/register?role=freelancer" className="hover:text-white transition-colors">Join as Freelancer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/freelancers?skill=React" className="hover:text-white transition-colors">Frontend Dev</Link></li>
              <li><Link href="/freelancers?skill=Node.js" className="hover:text-white transition-colors">Backend Dev</Link></li>
              <li><Link href="/freelancers?skill=UI+%2F+UX+Design" className="hover:text-white transition-colors">UI/UX Design</Link></li>
              <li><Link href="/freelancers?skill=Machine+Learning" className="hover:text-white transition-colors">Data Science</Link></li>
              <li><Link href="/freelancers?skill=Copywriting" className="hover:text-white transition-colors">Content Writing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 SkillMarket AI. Built by Auwal Mohammed.</p>
          <p className="text-sm text-gray-500">Connecting students with opportunities worldwide 🌍</p>
        </div>
      </div>
    </footer>
  );
}
