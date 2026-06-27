import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowRight, Star, Shield, Zap, Users, Briefcase, TrendingUp, ChevronDown, ChevronUp, CheckCircle, Code, Palette, PenTool, BarChart, Video, Smartphone } from "lucide-react";
import { useListFreelancers, useListProjects } from "@workspace/api-client-react";
import FreelancerCard from "../components/common/FreelancerCard";
import ProjectCard from "../components/common/ProjectCard";

const CATEGORIES = [
  { icon: Code, name: "Development", color: "bg-blue-100 text-blue-600", skills: ["React", "Node.js", "Python"] },
  { icon: Palette, name: "Design", color: "bg-pink-100 text-pink-600", skills: ["UI/UX", "Figma", "Illustration"] },
  { icon: PenTool, name: "Writing", color: "bg-green-100 text-green-600", skills: ["Copywriting", "Content"] },
  { icon: BarChart, name: "Data Science", color: "bg-purple-100 text-purple-600", skills: ["ML", "Analytics"] },
  { icon: Smartphone, name: "Mobile", color: "bg-orange-100 text-orange-600", skills: ["React Native", "Flutter"] },
  { icon: Video, name: "Creative", color: "bg-rose-100 text-rose-600", skills: ["Video", "Photography"] },
];

const STATS = [
  { value: "10,000+", label: "Freelancers" },
  { value: "5,000+", label: "Projects Posted" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "50+", label: "Skill Categories" },
];

const TESTIMONIALS = [
  { name: "Aisha Bello", role: "Computer Science Student, UniLag", text: "SkillMarket AI matched me with my first real client in 48 hours. The AI matching is spot on — it found projects that actually fit my React skills.", rating: 5, avatar: null },
  { name: "James Okonkwo", role: "Startup Founder, Lagos", text: "We found an incredible frontend developer through SkillMarket. The talent quality from students is surprisingly exceptional and the rates are fair.", rating: 5, avatar: null },
  { name: "Fatima Suleiman", role: "Graphic Design Student, BUK", text: "I've earned over $2,000 in my first semester on SkillMarket. The platform makes it easy to showcase my portfolio and get hired.", rating: 5, avatar: null },
];

const FAQS = [
  { q: "Is SkillMarket AI only for students?", a: "No! While we love students, SkillMarket is open to all freelancers and clients. Students get profile badges to highlight their academic background." },
  { q: "How does AI matching work?", a: "Our AI analyzes your skill profile, proficiency levels, and past work to match you with the best projects. Clients get matched with freelancers whose skills align with their requirements." },
  { q: "Is it free to join?", a: "Yes, joining SkillMarket is completely free for both freelancers and clients. We believe talent should have zero barriers to opportunity." },
  { q: "How do I get paid?", a: "Clients and freelancers agree on rates directly. Once a project is complete, payment is coordinated through your preferred method." },
  { q: "Can I post a project as a client?", a: "Absolutely! Register as a client, describe your project with skills needed and budget, and receive applications from matched freelancers within hours." },
];

export default function HomePage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: featuredFreelancers } = useListFreelancers({ limit: 4, offset: 0 });
  const { data: featuredProjects } = useListProjects({ limit: 4, status: "open" });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/projects?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
              <Zap size={14} className="text-yellow-400" />
              AI-Powered Talent Matching
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Where Student Talent<br />
              <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Meets Real Opportunity</span>
            </h1>
            <p className="text-lg sm:text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
              The AI-powered marketplace connecting skilled students and freelancers with clients worldwide. Get matched instantly. Build your future.
            </p>
            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search for projects, skills, or talent..."
                  className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-2xl border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 text-base"
                />
              </div>
              <button type="submit" className="px-6 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-2xl transition-colors shadow-lg">
                Search
              </button>
            </form>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?role=freelancer" className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm px-8 py-3.5">
                Join as Freelancer
              </Link>
              <Link href="/register?role=client" className="btn-primary bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-3.5">
                Hire Talent <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">Find talent across every discipline</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href={`/freelancers?skill=${encodeURIComponent(cat.skills[0])}`}
                className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                  <cat.icon size={22} />
                </div>
                <span className="font-semibold text-sm text-gray-900 text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Top Freelancers</h2>
              <p className="section-subtitle">Exceptional talent ready to work</p>
            </div>
            <Link href="/freelancers" className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {featuredFreelancers && featuredFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredFreelancers.map(f => (
                <FreelancerCard
                  key={f.id}
                  id={f.id}
                  name={f.user?.name ?? "Freelancer"}
                  headline={f.headline}
                  bio={f.bio}
                  hourlyRate={f.hourlyRate}
                  avatarUrl={f.user?.avatarUrl}
                  averageRating={f.averageRating}
                  totalReviews={f.totalReviews}
                  completedProjects={f.completedProjects}
                  availabilityStatus={f.availabilityStatus}
                  university={f.user?.university}
                  skills={f.skills}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Be the first to join as a freelancer!</p>
              <Link href="/register?role=freelancer" className="mt-4 btn-primary inline-flex">Get Started</Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Latest Projects</h2>
              <p className="section-subtitle">Opportunities waiting for your skills</p>
            </div>
            <Link href="/projects" className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {featuredProjects && featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProjects.map(p => (
                <ProjectCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  description={p.description}
                  category={p.category}
                  budgetMin={p.budgetMin}
                  budgetMax={p.budgetMax}
                  timelineWeeks={p.timelineWeeks}
                  status={p.status}
                  clientName={p.clientName}
                  requiredSkills={p.requiredSkills}
                  applicationCount={p.applicationCount}
                  createdAt={p.createdAt}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No projects yet. Be the first to post one!</p>
              <Link href="/register?role=client" className="mt-4 btn-primary inline-flex">Post a Project</Link>
            </div>
          )}
        </div>
      </section>

      {/* Why SkillMarket */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Why SkillMarket AI?</h2>
            <p className="section-subtitle">Built different. Built for students.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, color: "bg-yellow-100 text-yellow-600", title: "AI-Powered Matching", desc: "Our algorithm weighs your skill proficiency levels against project requirements to surface the best fits — not just keyword matches." },
              { icon: Shield, color: "bg-green-100 text-green-600", title: "Safe & Transparent", desc: "Clear profiles, honest reviews, and direct communication. No hidden fees or surprise deductions." },
              { icon: TrendingUp, color: "bg-indigo-100 text-indigo-600", title: "Career Growth", desc: "Build a real portfolio, earn money while studying, and connect with clients who believe in emerging talent." },
            ].map(f => (
              <div key={f.title} className="p-8 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Loved by Students & Clients</h2>
            <p className="section-subtitle">Real stories from our community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white p-8 rounded-2xl shadow-sm border border-white">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2"><Briefcase size={20} className="text-indigo-600" /> For Freelancers</h3>
              {["Create your profile and add your skills", "Get AI-matched to relevant projects", "Apply with a custom cover letter and rate", "Get hired and start building your portfolio"].map((step, i) => (
                <div key={i} className="flex gap-4 mb-6">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-gray-600 pt-1">{step}</p>
                </div>
              ))}
              <Link href="/register?role=freelancer" className="btn-primary mt-2">Join as Freelancer <ArrowRight size={16} /></Link>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2"><Users size={20} className="text-indigo-600" /> For Clients</h3>
              {["Post your project with skills and budget", "Receive applications from matched freelancers", "Review profiles, portfolios and rates", "Hire the best fit and collaborate"].map((step, i) => (
                <div key={i} className="flex gap-4 mb-6">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-gray-600 pt-1">{step}</p>
                </div>
              ))}
              <Link href="/register?role=client" className="btn-primary mt-2">Post a Project <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                  {faq.q}
                  {openFaq === i ? <ChevronUp size={18} className="text-indigo-500 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">Join thousands of students and clients already on SkillMarket AI.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?role=freelancer" className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors">
                Start as Freelancer
              </Link>
              <Link href="/register?role=client" className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-400 transition-colors border border-indigo-400">
                Hire Talent
              </Link>
            </div>
            <p className="mt-6 text-indigo-300 text-sm">
              Questions? Email us at{" "}
              <a href="mailto:hello@skillmarket.ai" className="underline hover:text-white">hello@skillmarket.ai</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
