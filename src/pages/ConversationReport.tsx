import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Loader2,
  FileText,
  Heart,
  Brain,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Share2,
  Moon,
  Briefcase,
  HeartHandshake,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { chatbotConversationService } from '@/services/chatbotConversationService';
import { ChatMessage, chatbotService } from '@/services/chatbotService';

// Topic config for theming
const TOPIC_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  accentColor: string;
  badgeBg: string;
}> = {
  sleep: {
    label: 'Sleep Assessment',
    icon: Moon,
    color: 'text-blue-600',
    bgGradient: 'from-slate-900 via-indigo-950 to-blue-950',
    accentColor: 'blue',
    badgeBg: 'bg-blue-100 text-blue-700',
  },
  couples: {
    label: 'Couples Therapy',
    icon: HeartHandshake,
    color: 'text-rose-500',
    bgGradient: 'from-rose-50 via-pink-50 to-orange-50',
    accentColor: 'rose',
    badgeBg: 'bg-rose-100 text-rose-700',
  },
  'work-stress': {
    label: 'Work Stress',
    icon: Briefcase,
    color: 'text-teal-600',
    bgGradient: 'from-slate-50 via-teal-50 to-cyan-50',
    accentColor: 'teal',
    badgeBg: 'bg-teal-100 text-teal-700',
  },
  default: {
    label: 'Mental Wellness',
    icon: Heart,
    color: 'text-purple-600',
    bgGradient: 'from-indigo-50 via-purple-50 to-pink-50',
    accentColor: 'purple',
    badgeBg: 'bg-purple-100 text-purple-700',
  },
};

interface ReportData {
  keyConcerns: string[];
  patterns: string[];
  recommendations: string[];
  summary: string;
  severityLevel: 'mild' | 'moderate' | 'significant';
  suggestedNextSteps: string[];
}

// Parse the AI-generated report text into structured data
function parseReportFromText(text: string): ReportData {
  const sections = {
    keyConcerns: [] as string[],
    patterns: [] as string[],
    recommendations: [] as string[],
    summary: '',
    severityLevel: 'moderate' as 'mild' | 'moderate' | 'significant',
    suggestedNextSteps: [] as string[],
  };

  // Try JSON parsing first
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return {
        keyConcerns: parsed.keyConcerns || parsed.key_concerns || [],
        patterns: parsed.patterns || parsed.identified_patterns || [],
        recommendations: parsed.recommendations || [],
        summary: parsed.summary || parsed.overview || '',
        severityLevel: parsed.severityLevel || parsed.severity_level || 'moderate',
        suggestedNextSteps: parsed.suggestedNextSteps || parsed.next_steps || [],
      };
    }
  } catch {
    // Fall through to text parsing
  }

  // Fallback: parse markdown sections
  const lines = text.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const lowerLine = trimmed.toLowerCase();

    if (lowerLine.includes('summary') || lowerLine.includes('overview')) {
      currentSection = 'summary';
      continue;
    } else if (lowerLine.includes('key concern') || lowerLine.includes('primary concern')) {
      currentSection = 'concerns';
      continue;
    } else if (lowerLine.includes('pattern')) {
      currentSection = 'patterns';
      continue;
    } else if (lowerLine.includes('recommendation')) {
      currentSection = 'recommendations';
      continue;
    } else if (lowerLine.includes('next step') || lowerLine.includes('suggested')) {
      currentSection = 'nextsteps';
      continue;
    } else if (lowerLine.includes('severity') || lowerLine.includes('level')) {
      if (lowerLine.includes('mild') || lowerLine.includes('low')) sections.severityLevel = 'mild';
      else if (lowerLine.includes('significant') || lowerLine.includes('high') || lowerLine.includes('severe')) sections.severityLevel = 'significant';
      continue;
    }

    // Extract bullet items
    const bulletMatch = trimmed.match(/^[-*•]\s*(.+)/);
    const numberedMatch = trimmed.match(/^\d+[.)]\s*(.+)/);
    const content = bulletMatch?.[1] || numberedMatch?.[1];

    if (content) {
      switch (currentSection) {
        case 'concerns': sections.keyConcerns.push(content); break;
        case 'patterns': sections.patterns.push(content); break;
        case 'recommendations': sections.recommendations.push(content); break;
        case 'nextsteps': sections.suggestedNextSteps.push(content); break;
      }
    } else if (currentSection === 'summary' && trimmed) {
      sections.summary += (sections.summary ? ' ' : '') + trimmed;
    }
  }

  // Fallback defaults
  if (!sections.summary) sections.summary = 'Based on your conversation, we identified several areas where professional support could be helpful.';
  if (sections.keyConcerns.length === 0) sections.keyConcerns = ['Concerns were discussed during the conversation'];
  if (sections.recommendations.length === 0) sections.recommendations = ['Consider scheduling an initial consultation with a therapist'];
  if (sections.suggestedNextSteps.length === 0) sections.suggestedNextSteps = ['Review the recommended therapists', 'Schedule an initial consultation'];

  return sections;
}

const ConversationReport = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const promptName = searchParams.get('page') || 'default';
  const topicConfig = TOPIC_CONFIG[promptName] || TOPIC_CONFIG.default;
  const TopicIcon = topicConfig.icon;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [conversationDate, setConversationDate] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadConversationAndGenerateReport(id);
    }
  }, [id]);

  const loadConversationAndGenerateReport = async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Load the conversation
      const conversation = await chatbotConversationService.getConversation(conversationId);
      if (!conversation || !conversation.conversation_data) {
        setError('Conversation not found');
        return;
      }

      setMessages(conversation.conversation_data);
      setConversationDate(conversation.started_at || new Date().toISOString());

      // Generate report using the AI
      const reportPrompt = `You are a clinical assessment AI. Analyze the following therapy intake conversation and produce a structured patient-facing report.

The conversation topic is: ${topicConfig.label}

Return ONLY valid JSON in the following format (no markdown code fences):
{
  "summary": "A warm, empathetic 2-3 sentence overview of what was discussed",
  "keyConcerns": ["Concern 1", "Concern 2", "Concern 3"],
  "patterns": ["Pattern or theme identified 1", "Pattern 2"],
  "recommendations": ["Specific recommendation 1", "Recommendation 2"],
  "severityLevel": "mild|moderate|significant",
  "suggestedNextSteps": ["Step 1", "Step 2", "Step 3"]
}

Rules:
- Write in a warm, supportive tone - this is patient-facing
- Identify 2-5 key concerns from the conversation
- Note behavioral or emotional patterns
- Provide actionable recommendations
- Assess severity honestly but gently
- Suggest concrete next steps

Here is the conversation:
${conversation.conversation_data.map(m => `${m.role}: ${m.content}`).join('\n\n')}`;

      const reportResponse = await chatbotService.sendMessage([
        { role: 'user', content: reportPrompt }
      ]);

      const parsed = parseReportFromText(reportResponse.message);
      setReport(parsed);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Unable to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const severityConfig = {
    mild: { label: 'Mild', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    moderate: { label: 'Moderate', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
    significant: { label: 'Significant', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Generating your report...</p>
          <p className="text-gray-400 text-sm mt-1">Analyzing your conversation</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-800 font-medium">{error}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!report) return null;
  const severity = severityConfig[report.severityLevel];
  const SeverityIcon = severity.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to={id ? `/chat/${id}` : '/'}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                topicConfig.accentColor === 'blue' ? 'from-blue-400 to-indigo-600' :
                topicConfig.accentColor === 'rose' ? 'from-rose-400 to-pink-600' :
                topicConfig.accentColor === 'teal' ? 'from-teal-500 to-cyan-600' :
                'from-purple-500 to-pink-500'
              } flex items-center justify-center`}>
                <TopicIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">Your Assessment Report</h1>
                <p className="text-xs text-gray-500">
                  {new Date(conversationDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={topicConfig.badgeBg}>{topicConfig.label}</Badge>
            {id && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden sm:flex"
              >
                <Link to={`/referral/${id}${promptName !== 'default' ? `?page=${promptName}` : ''}`}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share with Therapist
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Card */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${
            topicConfig.accentColor === 'blue' ? 'from-blue-400 to-indigo-600' :
            topicConfig.accentColor === 'rose' ? 'from-rose-400 to-pink-500' :
            topicConfig.accentColor === 'teal' ? 'from-teal-400 to-cyan-500' :
            'from-purple-400 to-pink-500'
          }`} />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-gray-500" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{report.summary}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Assessment Level:</span>
              <Badge variant="outline" className={severity.color}>
                <SeverityIcon className="h-3 w-3 mr-1" />
                {severity.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Concerns */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-rose-400" />
                Key Concerns Identified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.keyConcerns.map((concern, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-rose-600">{i + 1}</span>
                    </div>
                    <span className="text-gray-700 text-sm leading-relaxed">{concern}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Patterns */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-indigo-400" />
                Patterns & Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.patterns.map((pattern, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">{i + 1}</span>
                    </div>
                    <span className="text-gray-700 text-sm leading-relaxed">{pattern}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-green-500" />
              Suggested Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {report.suggestedNextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">{i + 1}</span>
                  </div>
                  <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Conversation Stats */}
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {messages.length} messages
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(conversationDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs">This report is AI-generated and should be reviewed by a licensed professional.</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Ready to take the next step?</p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild className={`${
              topicConfig.accentColor === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
              topicConfig.accentColor === 'rose' ? 'bg-rose-500 hover:bg-rose-600' :
              topicConfig.accentColor === 'teal' ? 'bg-teal-600 hover:bg-teal-700' :
              'bg-purple-600 hover:bg-purple-700'
            }`}>
              <Link to="/find-therapist">Find a Therapist</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={id ? `/chat/${id}` : '/'}>Back to Conversation</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConversationReport;
