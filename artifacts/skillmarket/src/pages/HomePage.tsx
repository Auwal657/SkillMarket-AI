import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowRight, Star, Shield, Zap, Users, Briefcase, TrendingUp, ChevronDown, ChevronUp, CheckCircle, Code, Palette, PenTool, BarChart, Video, Smartphone, GraduationCap } from "lucide-react";
import { useListFreelancers, useListProjects } from "@workspace/api-client-react";
import FreelancerCard from "../components/common/FreelancerCard";
import ProjectCard from "../components/common/ProjectCard";
import { cn } from "../lib/utils";

const CATEGORIES = [
  { icon: Code, name: "Development", color: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/50", skills: ["React", "Node.js", "Python"] },
  { icon: Palette, name: "Design", color: "bg-pink-50 text-pink-600 ring-1 ring-pink-200/50", skills: ["UI/UX", "Figma", "Illustration"] },
  { icon: PenTool, name: "Writing", color: "bg-green-50 text-green-600 ring-1 ring-green-200/50", skills: ["Copywriting", "Content"] },
  { icon: BarChart, name: "Data Science", color: "bg-purple-50 text-purple-600 ring-1 ring-purple-200/50", skills: ["ML", "Analytics"] },
  { icon: Smartphone, name: "Mobile", color: "bg-orange-50 text-orange-600 ring-1 ring-orange-200/50", skills: ["React Native", "Flutter"] },
  { icon: Video, name: "Creative", color: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/50", skills: ["Video", "Photography"] },
];

const STATS = [
  { value: "10k+", label: "Top Talent" },
  { value: "$2M+", label: "Earned by Students" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24h", label: "Average Match Time" },
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { data: featuredFreelancers } = useListFreelancers({ limit: 4, offset: 0 });
  const { data: featuredProjects } = useListProjects({ limit: 4, status: "open" });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/projects?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a0a] text-white pt-24 pb-32 lg:pt-36 lg:pb-40">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-4xl mx-auto animate-in">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-8 border border-white/10 shadow-2xl">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              AI-Powered Talent Matching
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
              Where Student Talent<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 animate-shimmer bg-[length:200%_auto]">Meets Real Work.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The premium marketplace connecting exceptional African students and freelancers with global clients. Ship real projects, build your career.
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Try 'React developer' or 'UI Design'..."
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md text-white placeholder-gray-400 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white/15 transition-all text-base shadow-2xl"
                />
              </div>
              <button type="submit" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                Search
              </button>
            </form>
            
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-indigo-400" /> Free to join
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-indigo-400" /> Vetted talent
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-indigo-400" /> Secure escrow
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Elegant bar */}
      <section className="bg-white border-b border-gray-200 py-10 relative -mt-8 mx-4 sm:mx-8 rounded-2xl shadow-xl z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
            {STATS.map((stat, i) => (
              <div key={stat.label} className={cn("text-center", i % 2 !== 0 && "md:border-l md:border-gray-100", i === 0 && "border-none")}>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section bg-gray-50">
        <div className="page-container pt-10">
          <div className="text-center mb-16">
            <h2 className="section-title">Explore by Category</h2>
            <p className="section-subtitle">Find specialized talent for any technical or creative need</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href={`/freelancers?skill=${encodeURIComponent(cat.skills[0])}`}
                className="group flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${cat.color}`}>
                  <cat.icon size={26} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {cat.skills.map(s => (
                      <span key={s} className="text-xs text-gray-500">{s}</span>
                    ))}
                  </div>
                </div>
                <ArrowRight size={20} className="text-gray-300 ml-auto self-center group-hover:text-indigo-600 transition-colors group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="section">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="section-title">Top Talent</h2>
              <p className="section-subtitle">Work with the top 1% of student freelancers</p>
            </div>
            <Link href="/freelancers" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors group">
              Browse all talent <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {featuredFreelancers && featuredFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              <p>Be the first to join as a freelancer!</p>
              <Link href="/register?role=freelancer" className="mt-4 btn-primary">Join Now</Link>
            </div>
          )}
        </div>
      </section>

      {/* Why SkillMarket */}
      <section className="bg-[#0a0a0a] text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="page-container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Built for the ambitious.</h2>
            <p className="text-xl text-gray-400">SkillMarket AI removes the friction from freelancing so you can focus on shipping.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { icon: Zap, title: "Smart Matching", desc: "Our algorithm reads beyond keywords to match project requirements with actual skill proficiency levels." },
              { icon: Shield, title: "Escrow Protection", desc: "Work with confidence. Payments are secured in escrow before work begins and released upon approval." },
              { icon: Briefcase, title: "Verified Credentials", desc: "Student status and skills are verified, bringing trust and transparency to every interaction." },
            ].map((f, i) => (
              <div key={f.title} className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 mb-6 border border-indigo-500/30">
                  <f.icon size={24} />
                </div>
                <h3 className="font-bold text-xl text-white mb-3 tracking-tight">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="section bg-gray-50">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="section-title">Latest Opportunities</h2>
              <p className="section-subtitle">Real projects posted by verified clients</p>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors group">
              View all projects <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              <p>No projects yet. Be the first to post one!</p>
              <Link href="/register?role=client" className="mt-4 btn-primary">Post a Project</Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-white">
        <div className="page-container">
          <div className="text-center mb-20">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">A seamless process for both sides of the marketplace</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            <div className="bg-indigo-50/50 p-8 md:p-12 rounded-3xl border border-indigo-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg"><GraduationCap size={24} /></div>
                For Freelancers
              </h3>
              <div className="space-y-8 relative before:absolute before:inset-y-2 before:left-[15px] before:w-0.5 before:bg-indigo-200">
                {[
                  { t: "Create Profile", d: "Showcase your skills, portfolio, and student credentials." },
                  { t: "Get Matched", d: "Our AI finds projects that perfectly fit your proficiency levels." },
                  { t: "Submit Proposals", d: "Apply with competitive rates and stand out to clients." },
                  { t: "Get Paid", d: "Deliver great work and receive secure payments via escrow." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-5 relative z-10">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ring-4 ring-indigo-50 shadow-sm">{i + 1}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{step.t}</h4>
                      <p className="text-gray-600 text-sm">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 ml-13">
                <Link href="/register?role=freelancer" className="btn-primary w-full sm:w-auto">Join as Talent</Link>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 md:p-12 rounded-3xl border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-gray-900 text-white rounded-lg"><Briefcase size={24} /></div>
                For Clients
              </h3>
              <div className="space-y-8 relative before:absolute before:inset-y-2 before:left-[15px] before:w-0.5 before:bg-gray-300">
                {[
                  { t: "Post a Project", d: "Define requirements, skills needed, and set your budget." },
                  { t: "Review Matches", d: "Get instant AI recommendations for the best talent." },
                  { t: "Hire Safely", d: "Review portfolios, interview, and fund the escrow." },
                  { t: "Approve Work", d: "Review the deliverables and release payment." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-5 relative z-10">
                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ring-4 ring-gray-50 shadow-sm">{i + 1}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{step.t}</h4>
                      <p className="text-gray-600 text-sm">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 ml-13">
                <Link href="/register?role=client" className="btn-secondary w-full sm:w-auto border-gray-300 hover:border-gray-400">Start Hiring</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="page-container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Loved by the community</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-900/20 flex flex-col h-full">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-8 flex-grow font-medium">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center text-indigo-700 text-sm font-bold border border-indigo-200">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section bg-white">
        <div className="page-container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className={cn("bg-white rounded-2xl border transition-all duration-200 overflow-hidden", openFaq === i ? "border-indigo-300 shadow-md ring-1 ring-indigo-50" : "border-gray-200 hover:border-gray-300")}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className={cn("font-semibold pr-4", openFaq === i ? "text-indigo-900" : "text-gray-900")}>{faq.q}</span>
                  <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", openFaq === i ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500")}>
                    {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                <div 
                  className={cn("px-6 overflow-hidden transition-all duration-300 ease-in-out", openFaq === i ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0")}
                >
                  <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-50"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-[#0a0a0a] rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
            
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 relative z-10">Ready to build?</h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">Join the thousands of students and clients shipping real work on SkillMarket AI.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/register?role=freelancer" className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg active:scale-95">
                Join as Talent
              </Link>
              <Link href="/register?role=client" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 active:scale-95">
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
