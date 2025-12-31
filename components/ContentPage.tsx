
import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, Check, AlertCircle, Book, Code, Users, CreditCard, Lock, Server, Globe, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ContentPageProps {
  pageId: string;
  onBack: () => void;
}

const ContentPage: React.FC<ContentPageProps> = ({ pageId, onBack }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
      setIsProcessing(plan);
      
      // Simulate API latency
      await new Promise(r => setTimeout(r, 1500));
      
      if (isSupabaseConfigured()) {
          // PROD: This would be the code
          /*
          const { data, error } = await supabase.functions.invoke('create-checkout-session', {
             body: { plan: plan }
          });
          if (data?.url) window.location.href = data.url;
          */
          alert(`[Stripe Hook] Production: Would redirect to Stripe Checkout for ${plan} plan.`);
      } else {
          // DEMO
          alert(`Success! You have subscribed to the ${plan} plan (Demo Mode).`);
      }
      setIsProcessing(null);
  };

  const renderContent = () => {
    switch (pageId) {
      case 'pricing':
        return (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-4">Simple, Transparent Pricing</h1>
              <p className="text-zinc-600 dark:text-zinc-400">Choose the plan that fits your community size and needs.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Community</h3>
                    <div className="text-4xl font-display font-bold text-zinc-900 dark:text-white mt-2">$0</div>
                    <p className="text-sm text-zinc-500 mt-1">Free forever for small groups</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    {['Up to 500 reports/mo', 'Basic Map View', '7-day data retention', 'Community Support'].map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                            <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => handleSubscribe('free')}
                    disabled={!!isProcessing}
                    className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-lg text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    {isProcessing === 'free' ? <Loader2 size={16} className="mx-auto animate-spin"/> : 'Get Started'}
                </button>
              </div>

              {/* Pro */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border-2 border-orange-500 shadow-xl flex flex-col relative">
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Most Popular
                </div>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Town & City</h3>
                    <div className="text-4xl font-display font-bold text-zinc-900 dark:text-white mt-2">$299<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
                    <p className="text-sm text-zinc-500 mt-1">For growing municipalities</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    {['Unlimited reports', 'AI Sentiment Analysis', 'Export to CSV/PDF', '1-year data retention', 'Priority Support', 'Custom Branding'].map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                            <Check size={16} className="text-orange-500 mr-2 flex-shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => handleSubscribe('pro')}
                    disabled={!!isProcessing}
                    className="w-full py-2 bg-orange-600 text-white font-bold rounded-lg text-sm hover:bg-orange-500 transition-colors"
                >
                     {isProcessing === 'pro' ? <Loader2 size={16} className="mx-auto animate-spin"/> : 'Start Free Trial'}
                </button>
              </div>

              {/* Enterprise */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Enterprise</h3>
                    <div className="text-4xl font-display font-bold text-zinc-900 dark:text-white mt-2">Custom</div>
                    <p className="text-sm text-zinc-500 mt-1">For state & national agencies</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    {['Unlimited Workspaces', 'SSO & Advanced Security', 'Custom AI Model Training', 'Unlimited data retention', 'Dedicated Success Manager', 'SLA Guarantee'].map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                            <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => handleSubscribe('enterprise')}
                    disabled={!!isProcessing}
                    className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-lg text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                >
                     {isProcessing === 'enterprise' ? <Loader2 size={16} className="mx-auto animate-spin"/> : 'Contact Sales'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'case-studies':
        return (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-4">Success Stories</h1>
              <p className="text-zinc-600 dark:text-zinc-400">See how real cities are transforming their operations with EchoSphere.</p>
            </div>

            <div className="grid gap-8">
                <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row">
                    <div className="md:w-1/3 bg-zinc-100 dark:bg-zinc-800 h-48 md:h-auto flex items-center justify-center">
                        <Globe className="text-zinc-300 dark:text-zinc-600 w-24 h-24" />
                    </div>
                    <div className="p-8 md:w-2/3">
                        <div className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider mb-2">Urban Mobility</div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Metropolis City reduces pothole repair time by 40%</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            By implementing EchoSphere's AI-driven categorization, Metropolis City was able to automatically route road hazard reports to the correct maintenance crews, bypassing manual triage completely.
                        </p>
                        <div className="flex items-center space-x-6 text-sm font-bold text-zinc-900 dark:text-white">
                            <div>
                                <span className="block text-2xl text-green-600">40%</span>
                                <span className="text-xs text-zinc-500 font-normal">Faster Repairs</span>
                            </div>
                            <div>
                                <span className="block text-2xl text-green-600">12k+</span>
                                <span className="text-xs text-zinc-500 font-normal">Reports Solved</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row">
                    <div className="md:w-1/3 bg-zinc-100 dark:bg-zinc-800 h-48 md:h-auto flex items-center justify-center">
                        <Shield className="text-zinc-300 dark:text-zinc-600 w-24 h-24" />
                    </div>
                    <div className="p-8 md:w-2/3">
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-2">Public Safety</div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Green Valley improves park safety with community insights</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            Green Valley used EchoSphere to identify low-light areas in public parks. Residents dropped pins where they felt unsafe, leading to a targeted LED lighting installation project.
                        </p>
                        <div className="flex items-center space-x-6 text-sm font-bold text-zinc-900 dark:text-white">
                            <div>
                                <span className="block text-2xl text-blue-600">85%</span>
                                <span className="text-xs text-zinc-500 font-normal">Resident Satisfaction</span>
                            </div>
                            <div>
                                <span className="block text-2xl text-blue-600">350</span>
                                <span className="text-xs text-zinc-500 font-normal">New Lights Installed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );

      case 'documentation':
      case 'api-reference':
        return (
          <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-1">
                <div className="font-bold text-zinc-900 dark:text-white mb-4">Contents</div>
                <button className="block text-sm text-orange-600 dark:text-orange-500 font-medium">Getting Started</button>
                <button className="block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Authentication</button>
                <button className="block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Endpoints</button>
                <button className="block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Webhooks</button>
                <button className="block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Errors</button>
            </div>
            <div className="md:col-span-3 prose prose-sm dark:prose-invert max-w-none">
                <h1>API Documentation</h1>
                <p className="lead">EchoSphere provides a RESTful API for accessing public feedback data and submitting new reports programmatically.</p>
                
                <h3>Authentication</h3>
                <p>All API requests require an API Key passed in the header:</p>
                <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800">
                    Authorization: Bearer YOUR_API_KEY
                </div>

                <h3>Retrieve Feedback</h3>
                <p>Get a list of feedback items within a specific bounding box.</p>
                <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800 mb-4">
                    GET /api/v1/feedback?bbox=-118.3,34.0,-118.2,34.1
                </div>

                <h3>Submit Report</h3>
                <p>Submit a new issue to the system.</p>
                <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800">
<pre>{`POST /api/v1/feedback
{
  "location": { "lat": 34.0522, "lng": -118.2437 },
  "content": "Traffic light malfunction",
  "category": "Traffic"
}`}</pre>
                </div>
            </div>
          </div>
        );

      case 'privacy-policy':
        return (
            <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
                <h1>Privacy Policy</h1>
                <p>Last updated: October 24, 2024</p>
                <p>At EchoSphere, we take your privacy seriously. This policy describes how we collect, use, and protect your data.</p>
                
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you create an account, submit feedback, or contact us. This may include:</p>
                <ul>
                    <li>Location data (latitude/longitude) associated with reports</li>
                    <li>Text and media content submitted in reports</li>
                    <li>Email address (for account holders)</li>
                </ul>

                <h3>2. How We Use Your Information</h3>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Provide, maintain, and improve our services</li>
                    <li>Analyze trends and usage in specific geographic areas</li>
                    <li>Detect and prevent fraud and abuse</li>
                </ul>

                <h3>3. Data Sharing</h3>
                <p>We do not sell your personal data. We share aggregated, anonymized feedback data with partner organizations (municipalities) to help them improve city services.</p>
            </div>
        );
      
      case 'terms-of-service':
         return (
            <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
                <h1>Terms of Service</h1>
                <p>Welcome to EchoSphere. By using our website and services, you agree to these terms.</p>
                
                <h3>1. Acceptable Use</h3>
                <p>You agree not to use EchoSphere to:</p>
                <ul>
                    <li>Submit false or misleading reports</li>
                    <li>Harass, abuse, or harm another person</li>
                    <li>Violate any applicable laws or regulations</li>
                </ul>

                <h3>2. Content Ownership</h3>
                <p>You retain ownership of the content you submit. However, you grant EchoSphere a worldwide, non-exclusive license to use, reproduce, and display your content in connection with the service.</p>

                <h3>3. Termination</h3>
                <p>We reserve the right to suspend or terminate your access to the service at any time for violation of these terms.</p>
            </div>
         );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Content Not Found</h2>
            <p className="text-zinc-500">The page you are looking for is currently under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-12 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
        
        <div className="animate-fade-in-up">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ContentPage;