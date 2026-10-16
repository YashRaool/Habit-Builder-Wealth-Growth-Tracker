import { useState } from 'react';
import {
  MessageSquare, Send, CheckCircle2, Star, Sparkles, AlertCircle,
  HelpCircle, ShieldCheck, HeartHandshake, Bug, Lightbulb, FileText
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/layout/PageHeader';
import Alert from '../components/ui/Alert';

const CATEGORIES = [
  { id: 'Feature Request', label: 'Feature Request', icon: Lightbulb, color: 'emerald' },
  { id: 'Bug Report', label: 'Bug Report', icon: Bug, color: 'rose' },
  { id: 'UX & Design', label: 'UX & Design', icon: Sparkles, color: 'violet' },
  { id: 'General Feedback', label: 'General', icon: MessageSquare, color: 'blue' },
];

const RATINGS = [
  { val: 5, label: 'Exceptional' },
  { val: 4, label: 'Very Good' },
  { val: 3, label: 'Acceptable' },
  { val: 2, label: 'Needs Polish' },
  { val: 1, label: 'Unsatisfactory' },
];

export default function Feedback() {
  const { user } = useAuth();
  const toast = useToast();

  const [category, setCategory] = useState('Feature Request');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please provide a descriptive subject line.');
      return;
    }
    if (!message.trim()) {
      setError('Please provide detailed feedback comments.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combines subject with category and rating for the ticket
      const formattedSubject = `[${category} · ${rating}★] ${subject.trim()}`;
      await adminAPI.submitFeedback({
        subject: formattedSubject,
        message: message.trim(),
      });
      toast.success('Your feedback has been logged with the engineering team.');
      setSubmitted(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit feedback. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubject('');
    setMessage('');
    setError('');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Institutional Feedback & Inquiries"
        description="Submit design critiques, report unexpected ledger anomalies, or recommend workflow enhancements."
      >
        <Badge color="emerald" size="md">
          <ShieldCheck size={13} /> Direct Engineering Channel
        </Badge>
      </PageHeader>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Feedback Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-7">
            {submitted ? (
              <div className="py-12 px-4 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Transmission Received</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-semibold text-slate-700">{user?.name}</span>. Your ticket has been logged into the platform moderation backlog and queued for review.
                  </p>
                </div>
                <div className="pt-2">
                  <Button onClick={handleReset} variant="secondary" size="sm">
                    Submit Another Dispatch
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">Submit Telemetry Feedback</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Every submission is reviewed directly by system architects.</p>
                </div>

                {error && (
                  <Alert variant="danger" title="Incomplete Transmission">
                    {error}
                  </Alert>
                )}

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Feedback Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
                            ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs font-semibold'
                                : 'bg-white border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <Icon size={14} className={isSelected ? 'text-emerald-600' : 'text-slate-400'} />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Star Satisfaction Rating */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Experience Rating
                    </label>
                    <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                      {RATINGS.find((r) => r.val === (hoverRating || rating))?.label} ({hoverRating || rating}/5)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (hoverRating || rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            size={20}
                            className={`transition-colors duration-150 ${
                              active
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 hover:text-slate-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Line */}
                <Input
                  label="Subject Summary"
                  id="feedback-subject"
                  placeholder="e.g. Real-time net worth chart refresh interval inquiry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting}
                  required
                />

                {/* Message Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="feedback-body" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Detailed Commentary
                    </label>
                    <span className="text-2xs font-mono text-slate-400 tabular-nums">
                      {message.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="feedback-body"
                    rows={5}
                    maxLength={1000}
                    placeholder="Provide context, workflow expectations, or reproduction steps..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Submit Button with isSubmitting Lock */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <Send size={14} />
                    {isSubmitting ? 'Transmitting Dispatch...' : 'Dispatch Ticket'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Platform Guidelines & SLA */}
        <div className="space-y-4">
          <Card className="p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" /> Resolution Workflow
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <Badge color="amber" size="sm" variant="rounded">1</Badge>
                <div>
                  <p className="font-semibold text-slate-800">Queue & Categorization</p>
                  <p className="text-2xs text-slate-400 mt-0.5">Tickets enter the moderation console marked as Open.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Badge color="blue" size="sm" variant="rounded">2</Badge>
                <div>
                  <p className="font-semibold text-slate-800">Engineering Review</p>
                  <p className="text-2xs text-slate-400 mt-0.5">Assigned to platform maintainers for triage.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Badge color="emerald" size="sm" variant="rounded">3</Badge>
                <div>
                  <p className="font-semibold text-slate-800">Resolution & Closure</p>
                  <p className="text-2xs text-slate-400 mt-0.5">Closed with internal audit notes and changelog tags.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6 bg-slate-50/60 border-slate-200/80 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HeartHandshake size={14} className="text-indigo-600" /> User Information
            </h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Origin Account</span>
                <span className="font-semibold text-slate-900 truncate max-w-[140px]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Access Level</span>
                <Badge color={user?.role === 'admin' ? 'violet' : 'emerald'} size="sm">
                  {user?.role || 'User'}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Telemetry Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Node
                </span>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
