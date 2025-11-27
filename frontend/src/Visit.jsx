import React, { useState } from 'react';
import { Menu, X, ChevronRight, Star, Users, Zap, Leaf, Shield, MapPin, Clock, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Visit = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="fixed w-full top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-cyan-500/20 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-linear-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">CW</span>
            </div>
            <span className="font-bold text-xl bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">CarWash</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('home')} className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Home</button>
            <button onClick={() => scrollToSection('services')} className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Services</button>
            <button onClick={() => scrollToSection('pricing')} className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Pricing</button>
            <button onClick={() => scrollToSection('facilities')} className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Facilities</button>
            <button onClick={() => scrollToSection('contact')} className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Contact</button>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="px-6 py-2 text-cyan-400 border border-cyan-400 rounded-lg hover:bg-cyan-400/10 transition-all font-semibold">
              Login
            </Link>
            <Link to="/signup" className="px-6 py-2 bg-linear-to-r from-cyan-500 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-semibold">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-cyan-500/20 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            <button onClick={() => scrollToSection('home')} className="block w-full text-left text-slate-300 hover:text-cyan-400 py-2 font-medium">Home</button>
            <button onClick={() => scrollToSection('services')} className="block w-full text-left text-slate-300 hover:text-cyan-400 py-2 font-medium">Services</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left text-slate-300 hover:text-cyan-400 py-2 font-medium">Pricing</button>
            <button onClick={() => scrollToSection('facilities')} className="block w-full text-left text-slate-300 hover:text-cyan-400 py-2 font-medium">Facilities</button>
            <button onClick={() => scrollToSection('contact')} className="block w-full text-left text-slate-300 hover:text-cyan-400 py-2 font-medium">Contact</button>
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Link to="/login" className="flex-1 px-4 py-2 text-cyan-400 border border-cyan-400 rounded-lg text-center font-semibold">Login</Link>
              <Link to="/signup" className="flex-1 px-4 py-2 bg-linear-to-r from-cyan-500 to-blue-600 rounded-lg text-center font-semibold">Sign Up</Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent leading-tight">
            Premium Doorstep Car Wash Service
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Book a wash in seconds. We come to you anytime, anywhere. Professional cleaning at your convenience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/login"
              className="px-8 py-4 bg-linear-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              Book Now <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-4 bg-slate-800 border-2 border-cyan-400 rounded-xl font-bold text-lg hover:bg-cyan-400/10 transform hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              Create Account <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16">
            <div className="p-4 md:p-6 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg hover:border-cyan-400 transition-colors">
              <div className="text-2xl md:text-3xl font-bold text-cyan-400">5000+</div>
              <div className="text-sm text-slate-400">Happy Customers</div>
            </div>
            <div className="p-4 md:p-6 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg hover:border-cyan-400 transition-colors">
              <div className="text-2xl md:text-3xl font-bold text-cyan-400">10K+</div>
              <div className="text-sm text-slate-400">Services Completed</div>
            </div>
            <div className="p-4 md:p-6 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg hover:border-cyan-400 transition-colors">
              <div className="text-2xl md:text-3xl font-bold text-cyan-400">4.9★</div>
              <div className="text-sm text-slate-400">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section id="services" className="relative py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          Our Services
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🚗', title: 'Single Car Wash', desc: 'Quick and efficient one-time wash for your vehicle', price: 'Starting ₹299' },
            { icon: '📅', title: 'Monthly Subscription', desc: 'Unlimited washes with our premium monthly pass', price: 'From ₹499/mo' },
            { icon: '🚙', title: 'Doorstep Service', desc: 'We come to your location. No hassle, maximum convenience', price: 'Included' },
            { icon: '✨', title: 'Interior Cleaning', desc: 'Deep cleaning of car interior with premium products', price: 'From ₹299' },
            { icon: '🌊', title: 'Premium Foam Wash', desc: 'Professional foam wash with eco-friendly materials', price: 'From ₹1499' },
            { icon: '⚡', title: 'Express Service', desc: '30-minute express wash for busy schedules', price: 'From ₹99' },
          ].map((service, idx) => (
            <div
              key={idx}
              className="group p-8 bg-linear-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20 transition-all hover:-translate-y-2 cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{service.icon}</div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-slate-400 mb-4">{service.desc}</p>
              <div className="text-cyan-400 font-semibold">{service.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          Why Choose Us
        </h2>          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="text-cyan-400" size={32} />, title: 'Secure OTP', desc: 'Safe signup with OTP verification' },
              { icon: <MapPin className="text-cyan-400" size={32} />, title: 'Real-time Tracking', desc: 'Track your rider in real-time' },
              { icon: <Zap className="text-cyan-400" size={32} />, title: 'Instant Notifications', desc: 'Get work done alerts instantly' },
              { icon: <CreditCard className="text-cyan-400" size={32} />, title: 'Secure Payments', desc: 'Multiple payment gateways' },
              { icon: <Users className="text-cyan-400" size={32} />, title: 'Trained Riders', desc: 'Professional & verified team' },
              { icon: <Clock className="text-cyan-400" size={32} />, title: '24/7 Support', desc: 'Round-the-clock customer care' },
              { icon: <Leaf className="text-cyan-400" size={32} />, title: 'Eco-Friendly', desc: '100% sustainable materials' },
              { icon: <Star className="text-cyan-400" size={32} />, title: 'Fast Guarantee', desc: 'Promise to complete on time' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-slate-800/50 border border-cyan-500/30 rounded-xl hover:border-cyan-400 hover:bg-slate-800/80 transition-all group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="relative py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          Simple Pricing
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Basic Wash',
              price: '₹499',
              features: ['Standard exterior wash', 'Professional equipment', 'Quick service', '30 mins'],
              highlighted: false,
            },
            {
              name: 'Premium Wash',
              price: '₹1499',
              features: ['Interior + Exterior', 'Premium foam wash', 'Air freshener', 'Tire shine', '45 mins'],
              highlighted: true,
            },
            {
              name: 'Monthly Pass',
              price: '$2499',
              features: ['Unlimited washes', 'Priority booking', '24/7 support', 'Free air freshener', 'Valid 30 days'],
              highlighted: false,
            },
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-8 rounded-2xl transition-all transform hover:scale-105 ${
                plan.highlighted
                  ? 'bg-linear-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/30'
                  : 'bg-slate-800/50 border border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-linear-to-r from-cyan-400 to-blue-500 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
              <div className="text-4xl font-bold text-cyan-400 mb-2">{plan.price}</div>
              <p className="text-slate-400 mb-6 text-sm">per service</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <ChevronRight size={16} className="text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  plan.highlighted
                    ? 'bg-linear-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/50'
                    : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FACILITIES SECTION ===== */}
      <section id="facilities" className="relative py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          Our Facilities
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[
              { icon: '🕐', title: '24/7 Customer Support', desc: 'Always available to help you with any queries or issues' },
              { icon: '👨‍💼', title: 'Trained Professionals', desc: 'Certified and experienced car wash experts on our team' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="text-4xl shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {[
              { icon: '🌱', title: '100% Eco-Friendly', desc: 'Sustainable products that care for your car and the planet' },
              { icon: '⚡', title: 'Fast Service Guarantee', desc: 'Quick turnaround without compromising on quality' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="text-4xl shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          How It Works
        </h2>

        <div className="grid md:grid-cols-5 gap-4 md:gap-2">
          {[
            { number: 1, title: 'Sign Up', desc: 'Create account with OTP' },
            { number: 2, title: 'Select', desc: 'Choose wash type & time' },
            { number: 3, title: 'Track', desc: 'Rider arrives at location' },
            { number: 4, title: 'Pay', desc: 'Secure payment options' },
            { number: 5, title: 'Enjoy', desc: 'Get completion notice' },
          ].map((step, idx) => (
            <div key={idx} className="relative">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-linear-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg md:text-xl mb-4 relative z-10 shadow-lg shadow-cyan-500/50">
                  {step.number}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
              </div>
              {idx < 4 && (
                <div className="hidden md:block absolute top-6 left-1/2 w-full h-1 bg-linear-to-r from-cyan-500/50 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section id="testimonials" className="relative py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          What Our Customers Say
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Rajesh Kumar',
              role: 'Business Owner',
              text: 'Amazing service! My car looks brand new. The team is professional and punctual. Highly recommended!',
              rating: 5,
            },
            {
              name: 'Priya Sharma',
              role: 'Customer',
              text: 'Love the convenience of doorstep service. No more trips to the wash station. Perfect timing always!',
              rating: 5,
            },
            {
              name: 'Amit Patel',
              role: 'Regular User',
              text: 'The monthly pass is a steal! I get unlimited washes and the quality is consistently excellent.',
              rating: 5,
            },
          ].map((testimonial, idx) => (
            <div key={idx} className="p-6 bg-slate-800/50 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-all">
              <div className="flex gap-1 mb-4">
                {Array(testimonial.rating).fill(0).map((_, i) => (
                  <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
              <div>
                <p className="font-bold">{testimonial.name}</p>
                <p className="text-slate-400 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-linear-to-r from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400 rounded-2xl backdrop-blur">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Experience Premium Car Wash?</h2>
            <p className="text-xl text-slate-300 mb-8">Join thousands of satisfied customers. Book your first wash today!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="px-8 py-4 bg-linear-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 border-2 border-cyan-400 rounded-xl font-bold text-lg hover:bg-cyan-400/10 transition-all"
              >
                Already Have Account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative border-t border-cyan-500/20 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">CW</span>
                </div>
                <span className="font-bold text-lg">CarWash</span>
              </div>
              <p className="text-slate-400 text-sm">Premium doorstep car washing service for everyone.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-cyan-400 transition-colors">Home</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-cyan-400 transition-colors">Services</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-cyan-400 transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-cyan-400 transition-colors">Contact</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center transition-all hover:border-cyan-400">f</a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center transition-all hover:border-cyan-400">𝕏</a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center transition-all hover:border-cyan-400">📷</a>
                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center transition-all hover:border-cyan-400">in</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2025 CarWash Service. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Animated Blob Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Visit;
