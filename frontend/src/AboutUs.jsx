import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { FiX } from "react-icons/fi";

export default function AboutUs() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              About <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">CarWash+</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Revolutionizing the car wash industry with smart technology, reliable service, and exceptional customer care.
            </p>
          </div>

          {/* Mission & Vision Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Mission */}
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To provide convenient, affordable, and high-quality car wash services using innovative technology that connects customers with professional service providers in their community.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To become the most trusted and accessible car wash platform, transforming how people maintain their vehicles and creating opportunities for service professionals.
              </p>
            </div>
          </div>

          {/* Why Choose Us */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose CarWash+?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast & Convenient</h3>
                <p className="text-gray-600">
                  Book your car wash in seconds and track it in real-time. Quick service without the hassle.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Team</h3>
                <p className="text-gray-600">
                  Trained and verified professionals ensure your car receives the best care possible.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Affordable Pricing</h3>
                <p className="text-gray-600">
                  Transparent, competitive pricing with loyalty rewards and special packages.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Safe</h3>
                <p className="text-gray-600">
                  Your vehicle and personal information are protected with industry-leading security.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Live Tracking</h3>
                <p className="text-gray-600">
                  Track your wash service in real-time with GPS location and progress updates.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Ratings & Reviews</h3>
                <p className="text-gray-600">
                  Transparent ratings help you choose the best service providers with confidence.
                </p>
              </div>
            </div>
          </section>

          {/* Our Services */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Services</h2>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Basic Wash</h4>
                    <p className="text-gray-600 text-sm">Exterior wash and dry</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Premium Wash</h4>
                    <p className="text-gray-600 text-sm">Deep clean with interior vacuum</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🧴</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Detailing</h4>
                    <p className="text-gray-600 text-sm">Professional polishing and waxing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Monthly Pass</h4>
                    <p className="text-gray-600 text-sm">Unlimited washes for a fixed price</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">By The Numbers</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { number: "10K+", label: "Happy Customers" },
                { number: "500+", label: "Service Professionals" },
                { number: "50K+", label: "Cars Washed" },
                { number: "4.8★", label: "Average Rating" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                  <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{stat.number}</p>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Team</h2>
            <p className="text-gray-600 text-lg mb-8">
              CarWash+ is built by a passionate team dedicated to revolutionizing the car wash industry. 
              Our experts combine technology innovation with customer service excellence.
            </p>
            <div className="bg-blue-50 rounded-lg p-8 border border-blue-100">
              <p className="text-gray-700 leading-relaxed">
                With combined expertise in mobile services, technology, and customer satisfaction, 
                our team works tirelessly to provide the best car wash experience possible. 
                We're committed to innovation, reliability, and making car maintenance convenient for everyone.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Contact our support team anytime.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="mailto:support@carwashplus.com" className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                Email Us
              </a>
              <a href="tel:+1234567890" className="bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Call Us
              </a>
            </div>
          </section>

          {/* Footer Info */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>© 2025 CarWash+. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
