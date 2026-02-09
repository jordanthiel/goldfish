import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  FileText,
  User,
  AlertTriangle,
  ClipboardList,
  Stethoscope,
  MessageSquare,
  Clock,
  Shield,
  Brain,
  Target,
  Activity,
  Printer,
  Download,
  Moon,
  HeartHandshake,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { chatbotConversationService } from '@/services/chatbotConversationService';
import { ChatMessage, chatbotService } from '@/services/chatbotService';

const TOPIC_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
}> = {
  sleep: {
    label: 'Sleep Assessment',
    icon: Moon,
    color: 'blue',
    badgeBg: 'bg-blue-100 text-blue-700',
  },
  couples: {
    label: 'Couples Therapy',
    icon: HeartHandshake,
    color: 'rose',
    badgeBg: 'bg-rose-100 text-rose-700',
  },
  'work-stress': {
    label: 'Work Stress',
    icon: Briefcase,
    color: 'teal',
    badgeBg: 'bg-teal-100 text-teal-700',
  },
  default: {
    label: 'General Intake',
    icon: Sparkles,
    color: 'purple',
    badgeBg: 'bg-purple-100 text-purple-700',
  },
};

interface ReferralData {
  patientOverview: {
    presentingConcerns: string;
    reportedSymptoms: string[];
    durationAndOnset: string;
    functionalImpact: string;
  };
  clinicalObservations: {
    moodAndAffect: string;
    cognitivePatterns: string[];
    riskFactors: string[];
    protectiveFactors: string[];
  };
  assessmentSummary: {
    primaryConcerns: string[];
    differentialConsiderations: string[];
    severityEstimate: 'mild' | 'moderate' | 'severe';
    urgency: 'routine' | 'soon' | 'urgent';
  };
  treatmentRecommendations: {
    suggestedApproaches: string[];
    focusAreas: string[];
    specialConsiderations: string[];
  };
  conversationHighlights: string[];
}

function parseReferralFromText(text: string): ReferralData {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return {
        patientOverview: {
          presentingConcerns: parsed.patientOverview?.presentingConcerns || parsed.patient_overview?.presenting_concerns || 'See conversation transcript',
          reportedSymptoms: parsed.patientOverview?.reportedSymptoms || parsed.patient_overview?.reported_symptoms || [],
          durationAndOnset: parsed.patientOverview?.durationAndOnset || parsed.patient_overview?.duration_and_onset || 'Not specified',
          functionalImpact: parsed.patientOverview?.functionalImpact || parsed.patient_overview?.functional_impact || 'Not specified',
        },
        clinicalObservations: {
          moodAndAffect: parsed.clinicalObservations?.moodAndAffect || parsed.clinical_observations?.mood_and_affect || 'See transcript',
          cognitivePatterns: parsed.clinicalObservations?.cognitivePatterns || parsed.clinical_observations?.cognitive_patterns || [],
          riskFactors: parsed.clinicalObservations?.riskFactors || parsed.clinical_observations?.risk_factors || [],
          protectiveFactors: parsed.clinicalObservations?.protectiveFactors || parsed.clinical_observations?.protective_factors || [],
        },
        assessmentSummary: {
          primaryConcerns: parsed.assessmentSummary?.primaryConcerns || parsed.assessment_summary?.primary_concerns || [],
          differentialConsiderations: parsed.assessmentSummary?.differentialConsiderations || parsed.assessment_summary?.differential_considerations || [],
          severityEstimate: parsed.assessmentSummary?.severityEstimate || parsed.assessment_summary?.severity_estimate || 'moderate',
          urgency: parsed.assessmentSummary?.urgency || parsed.assessment_summary?.urgency || 'routine',
        },
        treatmentRecommendations: {
          suggestedApproaches: parsed.treatmentRecommendations?.suggestedApproaches || parsed.treatment_recommendations?.suggested_approaches || [],
          focusAreas: parsed.treatmentRecommendations?.focusAreas || parsed.treatment_recommendations?.focus_areas || [],
          specialConsiderations: parsed.treatmentRecommendations?.specialConsiderations || parsed.treatment_recommendations?.special_considerations || [],
        },
        conversationHighlights: parsed.conversationHighlights || parsed.conversation_highlights || [],
      };
    }
  } catch {
    // Fall through
  }

  // Fallback
  return {
    patientOverview: {
      presentingConcerns: 'Unable to parse - please review transcript',
      reportedSymptoms: [],
      durationAndOnset: 'Not specified',
      functionalImpact: 'Not specified',
    },
    clinicalObservations: {
      moodAndAffect: 'Review transcript for clinical observations',
      cognitivePatterns: [],
      riskFactors: ['Unable to assess from automated analysis - clinical review required'],
      protectiveFactors: [],
    },
    assessmentSummary: {
      primaryConcerns: ['Please review full conversation transcript'],
      differentialConsiderations: [],
      severityEstimate: 'moderate',
      urgency: 'routine',
    },
    treatmentRecommendations: {
      suggestedApproaches: ['Clinical assessment recommended'],
      focusAreas: [],
      specialConsiderations: [],
    },
    conversationHighlights: [],
  };
}

const TherapistReferralReport = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const promptName = searchParams.get('page') || 'default';
  const topicConfig = TOPIC_CONFIG[promptName] || TOPIC_CONFIG.default;
  const TopicIcon = topicConfig.icon;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [report, setReport] = useState<ReferralData | null>(null);
  const [conversationDate, setConversationDate] = useState<string>('');
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (id) {
      loadAndGenerateReferral(id);
    }
  }, [id]);

  const loadAndGenerateReferral = async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const conversation = await chatbotConversationService.getConversation(conversationId);
      if (!conversation || !conversation.conversation_data) {
        setError('Conversation not found');
        return;
      }

      setMessages(conversation.conversation_data);
      setConversationDate(conversation.started_at || new Date().toISOString());

      const referralPrompt = `You are a clinical intake AI assistant. Analyze the following therapy intake conversation and produce a structured clinical referral report for the receiving therapist.

Conversation topic: ${topicConfig.label}

Return ONLY valid JSON (no markdown code fences) in the following format:
{
  "patientOverview": {
    "presentingConcerns": "Brief narrative of what brought the patient in",
    "reportedSymptoms": ["Symptom 1", "Symptom 2"],
    "durationAndOnset": "How long symptoms have been present",
    "functionalImpact": "How symptoms affect daily life"
  },
  "clinicalObservations": {
    "moodAndAffect": "Observed mood/affect from language used",
    "cognitivePatterns": ["Pattern 1", "Pattern 2"],
    "riskFactors": ["Risk factor 1"],
    "protectiveFactors": ["Protective factor 1"]
  },
  "assessmentSummary": {
    "primaryConcerns": ["Concern 1", "Concern 2"],
    "differentialConsiderations": ["Consideration 1"],
    "severityEstimate": "mild|moderate|severe",
    "urgency": "routine|soon|urgent"
  },
  "treatmentRecommendations": {
    "suggestedApproaches": ["CBT", "Mindfulness-based"],
    "focusAreas": ["Area 1", "Area 2"],
    "specialConsiderations": ["Any special notes for treating therapist"]
  },
  "conversationHighlights": ["Notable direct quote or paraphrase 1", "Notable quote 2"]
}

Rules:
- Write in professional clinical language
- Be specific about presenting symptoms
- Note risk factors and protective factors carefully
- Recommend evidence-based treatment approaches relevant to the presenting concerns
- Include significant patient statements as conversation highlights (paraphrased)
- Assess urgency honestly

Here is the conversation:
${conversation.conversation_data.map(m => `${m.role}: ${m.content}`).join('\n\n')}`;

      const response = await chatbotService.sendMessage([
        { role: 'user', content: referralPrompt }
      ]);

      const parsed = parseReferralFromText(response.message);
      setReport(parsed);
    } catch (err) {
      console.error('Error generating referral report:', err);
      setError('Unable to generate referral report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const severityConfig = {
    mild: { label: 'Mild', color: 'bg-green-100 text-green-700 border-green-200' },
    moderate: { label: 'Moderate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    severe: { label: 'Severe', color: 'bg-red-100 text-red-700 border-red-200' },
  };

  const urgencyConfig = {
    routine: { label: 'Routine', color: 'bg-blue-100 text-blue-700' },
    soon: { label: 'Schedule Soon', color: 'bg-amber-100 text-amber-700' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Generating clinical referral...</p>
          <p className="text-gray-400 text-sm mt-1">Analyzing conversation for clinical insights</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
  const severity = severityConfig[report.assessmentSummary.severityEstimate];
  const urgency = urgencyConfig[report.assessmentSummary.urgency];

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-20 print:static print:border-b-2 print:border-gray-300">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="print:hidden">
              <Link to={id ? `/chat/${id}/report` : '/'}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <h1 className="text-lg font-semibold text-gray-800">Clinical Referral Report</h1>
                <p className="text-xs text-gray-500">
                  Confidential — For receiving therapist only
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Badge className={topicConfig.badgeBg}>{topicConfig.label}</Badge>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Report Meta */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(conversationDate).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {messages.length} messages in intake
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="outline" className={severity.color}>
            Severity: {severity.label}
          </Badge>
          <Badge variant="outline" className={urgency.color}>
            {urgency.label}
          </Badge>
        </div>

        {/* Patient Overview */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-gray-500" />
              Patient Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Presenting Concerns</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{report.patientOverview.presentingConcerns}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Reported Symptoms</h4>
                <ul className="space-y-1">
                  {report.patientOverview.reportedSymptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                      {symptom}
                    </li>
                  ))}
                  {report.patientOverview.reportedSymptoms.length === 0 && (
                    <li className="text-sm text-gray-400 italic">No specific symptoms reported</li>
                  )}
                </ul>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Duration & Onset</h4>
                  <p className="text-sm text-gray-600">{report.patientOverview.durationAndOnset}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Functional Impact</h4>
                  <p className="text-sm text-gray-600">{report.patientOverview.functionalImpact}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Observations */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-5 w-5 text-gray-500" />
              Clinical Observations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Mood & Affect (from language analysis)</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{report.clinicalObservations.moodAndAffect}</p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Cognitive Patterns</h4>
              <div className="flex flex-wrap gap-2">
                {report.clinicalObservations.cognitivePatterns.map((pattern, i) => (
                  <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {pattern}
                  </Badge>
                ))}
                {report.clinicalObservations.cognitivePatterns.length === 0 && (
                  <span className="text-sm text-gray-400 italic">No specific patterns identified</span>
                )}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Factors
                </h4>
                <ul className="space-y-1">
                  {report.clinicalObservations.riskFactors.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                  {report.clinicalObservations.riskFactors.length === 0 && (
                    <li className="text-sm text-green-600 italic">No risk factors identified</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Protective Factors
                </h4>
                <ul className="space-y-1">
                  {report.clinicalObservations.protectiveFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                  {report.clinicalObservations.protectiveFactors.length === 0 && (
                    <li className="text-sm text-gray-400 italic">Not assessed</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Summary */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-gray-500" />
              Assessment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Primary Concerns</h4>
              <ol className="space-y-2">
                {report.assessmentSummary.primaryConcerns.map((concern, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-600 leading-relaxed">{concern}</span>
                  </li>
                ))}
              </ol>
            </div>
            {report.assessmentSummary.differentialConsiderations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Differential Considerations</h4>
                  <ul className="space-y-1">
                    {report.assessmentSummary.differentialConsiderations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Treatment Recommendations */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-gray-500" />
              Treatment Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggested Approaches</h4>
              <div className="flex flex-wrap gap-2">
                {report.treatmentRecommendations.suggestedApproaches.map((approach, i) => (
                  <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {approach}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Focus Areas</h4>
                <ul className="space-y-1">
                  {report.treatmentRecommendations.focusAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Brain className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Special Considerations</h4>
                <ul className="space-y-1">
                  {report.treatmentRecommendations.specialConsiderations.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Activity className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      {note}
                    </li>
                  ))}
                  {report.treatmentRecommendations.specialConsiderations.length === 0 && (
                    <li className="text-sm text-gray-400 italic">None noted</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Highlights */}
        {report.conversationHighlights.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                Notable Patient Statements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {report.conversationHighlights.map((highlight, i) => (
                  <div key={i} className="pl-4 border-l-2 border-gray-200 py-1">
                    <p className="text-sm text-gray-600 italic">"{highlight}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Transcript Toggle */}
        <Card className="border shadow-sm print:break-before-page">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-gray-500" />
                Full Conversation Transcript
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="print:hidden"
              >
                {showTranscript ? 'Hide' : 'Show'} Transcript
              </Button>
            </div>
          </CardHeader>
          {showTranscript && (
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-[500px] overflow-y-auto print:max-h-none print:overflow-visible">
                {messages.map((msg, i) => (
                  <div key={i} className={`text-sm ${msg.role === 'user' ? 'pl-4 border-l-2 border-blue-200' : 'pl-4 border-l-2 border-gray-200'}`}>
                    <span className={`font-semibold text-xs uppercase ${msg.role === 'user' ? 'text-blue-600' : 'text-gray-500'}`}>
                      {msg.role === 'user' ? 'Patient' : 'AI Intake'}
                    </span>
                    <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Important Disclaimer</p>
              <p className="mt-1 text-amber-700">
                This referral report was generated by an AI system based on a chatbot intake conversation. 
                It is intended as a preliminary assessment to assist the receiving therapist and should not replace 
                a thorough clinical evaluation. All observations are derived from text analysis and have not been 
                verified through clinical interview or standardized assessment tools.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4 print:py-8">
          <p>Generated by Goldfish AI Intake System</p>
          <p>Report ID: {id} | Generated: {new Date().toLocaleDateString()}</p>
        </div>
      </main>
    </div>
  );
};

export default TherapistReferralReport;
