import { useState } from 'react';
import { motion } from '../utils/simpleMotion';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Mail, Clock, ChevronRight } from 'lucide-react';
import TopNavbar from '../components/common/TopNavbar';
import HomeNavbar from '../components/common/HomeNavbar';
import HomeFooter from '../components/common/HomeFooter';
import BrandWordmark from '../components/common/BrandWordmark';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const lastUpdated = '20-4-2026';

  const sections = [
    { id: 'scope', title: '1. Scope of this policy' },
    { id: 'personal-data', title: '2. Personal data we collect' },
    { id: 'data-use', title: '3. How we use your data' },
    { id: 'legal-basis', title: '4. Legal basis for processing' },
    { id: 'sharing', title: '5. Sharing of personal data' },
    { id: 'cookies', title: '6. Cookies and tracking technologies' },
    { id: 'security', title: '7. Data storage and security' },
    { id: 'retention', title: '8. Data retention' },
    { id: 'rights', title: '9. Your privacy rights' },
    { id: 'children', title: "10. Children's privacy" },
    { id: 'transfers', title: '11. International data transfers' },
    { id: 'changes', title: '12. Changes to this policy' },
    { id: 'contact', title: '13. Contact us' },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopNavbar homeMobileMenu />
      <HomeNavbar openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} navigate={navigate} showBack />

      <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 pt-3">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -top-24 left-1/4 h-72 sm:h-80 md:h-96 w-72 sm:w-80 md:w-96 rounded-full bg-indigo-300/30 blur-3xl"
            animate={{ x: [0, 40, -20, 0], y: [0, -20, 20, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 right-1/4 h-72 sm:h-80 md:h-96 w-72 sm:w-80 md:w-96 rounded-full bg-sky-300/25 blur-3xl"
            animate={{ x: [0, -30, 30, 0], y: [0, 20, -20, 0], scale: [1, 1.15, 0.9, 1] }}
            transition={{ duration: 10, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-slate-50/80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center mb-8 sm:mb-10 md:mb-14"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50 px-4 py-2 mb-5 shadow-sm">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-800">Privacy Policy</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 font-display text-slate-900">
              <BrandWordmark inline className="h-10 sm:h-11 md:h-12 w-auto mr-2" />
              <span className="text-indigo-600">Privacy Policy</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              <BrandWordmark inline className="h-5 w-auto mx-1" /> (&apos;we&apos;, &apos;our&apos;, &apos;us&apos;) values your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform, website, and services.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <Clock className="h-4 w-4 text-slate-500" /> Last updated: <span className="font-medium text-slate-900">{lastUpdated}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <FileText className="h-4 w-4 text-slate-500" /> Read time: ~5 minutes
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 mt-10">
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-lg shadow-slate-200/50">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">On this page</h2>
                <ul className="space-y-2">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => scrollTo(s.id)} className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition">
                        <span className="truncate">{s.title}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400 opacity-80 group-hover:text-indigo-600 group-hover:opacity-100 transition" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40">
                <PolicySection id="scope" title="1. Scope of this policy">
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                    This Privacy Policy applies to all users of <BrandWordmark inline className="h-4 w-auto mx-1" />, including visitors, registered users, and customers, regardless of location.
                  </p>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base mt-2">
                    It covers personal data collected when you create an account, use our platform or services, and contact or interact with us.
                  </p>
                </PolicySection>
                <PolicySection id="personal-data" title="2. Personal data we collect">
                  <ul className="text-slate-600 text-sm sm:text-base leading-relaxed list-disc pl-5 space-y-2">
                    <li>Information you provide: full name, email address, phone number, profile details, business or listing information, and payment details (if applicable).</li>
                    <li>Automatically collected data: IP address, device information, browser type, and usage behavior such as pages visited and clicks.</li>
                    <li>Data from third parties: social media platforms (if login is integrated), analytics providers, and public sources.</li>
                    <li>Data we generate: insights created using analytics and AI to improve services and personalize user experience.</li>
                  </ul>
                </PolicySection>
                <PolicySection id="data-use" title="3. How we use your data">
                  <ul className="text-slate-600 text-sm sm:text-base leading-relaxed list-disc pl-5 space-y-2">
                    <li>Create and manage user accounts.</li>
                    <li>Provide and improve our services.</li>
                    <li>Enable listings, connections, and other platform features.</li>
                    <li>Process transactions and provide customer support.</li>
                    <li>Ensure security and prevent fraud.</li>
                    <li>Send updates, notifications, and marketing communications.</li>
                    <li>Analyze performance and improve user experience.</li>
                  </ul>
                </PolicySection>
                <PolicySection id="legal-basis" title="4. Legal basis for processing">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    We process your data based on your consent, contractual necessity, legal obligations, and legitimate business interests.
                  </p>
                </PolicySection>
                <PolicySection id="sharing" title="5. Sharing of personal data">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    We may share your data with service providers (hosting, payment, analytics), business partners (only when required for services), and legal authorities (if required by law).
                  </p>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2">
                    We do not sell your personal data to third parties.
                  </p>
                </PolicySection>
                <PolicySection id="cookies" title="6. Cookies and tracking technologies">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    We use cookies, web beacons, and similar technologies to operate the platform, remember your preferences, and—only with your consent—to measure site usage (for example, Google Analytics) and support advertising (for example, Meta Pixel).
                  </p>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2">
                    When you first visit our website, a cookie banner lets you accept all cookies, reject non-essential cookies, or manage preferences by category. Your choices are stored in a cookie on your device so we can honour them on future visits. You can update your preferences at any time using the &quot;Cookie preferences&quot; link in the site footer.
                  </p>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2">
                    Non-essential tracking scripts do not load until you opt in. You may also control cookies through your browser settings.
                  </p>
                </PolicySection>
                <PolicySection id="security" title="7. Data storage and security">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    We store your data securely using trusted infrastructure providers and implement encryption, access controls, secure servers, and regular monitoring.
                  </p>
                </PolicySection>
                <PolicySection id="retention" title="8. Data retention">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    We retain personal data as long as your account is active, as required by law, or for legitimate business purposes. When no longer needed, data is deleted or anonymized.
                  </p>
                </PolicySection>
                <PolicySection id="rights" title="9. Your privacy rights">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    You have the right to access your data, correct inaccurate data, delete your data, request data portability, and control marketing preferences.
                  </p>
                </PolicySection>
                <PolicySection id="children" title="10. Children's privacy">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    <BrandWordmark inline className="h-4 w-auto mx-1" /> does not knowingly collect data from individuals under 18 without parental consent.
                  </p>
                </PolicySection>
                <PolicySection id="transfers" title="11. International data transfers">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Your data may be processed in different countries. We ensure compliance with applicable data protection laws.
                  </p>
                </PolicySection>
                <PolicySection id="changes" title="12. Changes to this policy">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    We may update this Privacy Policy periodically. Changes will be posted on this page.
                  </p>
                </PolicySection>
                <PolicySection id="contact" title="13. Contact us">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center gap-2 mb-2"><Mail className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-semibold text-slate-900"><BrandWordmark inline className="h-4 w-auto mr-1" /> Team</h3></div>
                      <p className="text-sm text-slate-600">Email: <span className="font-medium text-slate-900">contact@cobrother.com</span></p>
                      <p className="text-sm text-slate-600 mt-1">Phone: <span className="font-medium text-slate-900">+91 80 8575 8575</span></p>
                    </div>
                  </div>
                </PolicySection>
              </div>
              <div className="h-10" />
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}

function PolicySection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 mt-10 first:mt-0">{title}</h2>
      {children}
      <div className="mt-8 mb-4 border-t border-slate-200" />
    </section>
  );
}
