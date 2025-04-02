import React, { useEffect, useState } from 'react';
import { riskAssessmentApi } from '../services/api';

interface Question {
  id: string;
  text: string;
  type: string;
  options: {
    id: string;
    text: string;
    value: number;
  }[];
}

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

const RiskAssessmentPage: React.FC = () => {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        const data = await riskAssessmentApi.getQuestionnaire();
        setQuestionnaire(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch risk assessment questionnaire');
        setLoading(false);
        console.error(err);
      }
    };

    fetchQuestionnaire();
  }, []);

  const handleOptionSelect = (questionId: string, value: number) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionnaire) return;
    
    try {
      setLoading(true);
      
      // Format responses for API
      const formattedResponses = Object.entries(responses).map(([questionId, value]) => ({
        questionId,
        value
      }));
      
      // Use a mock user ID for now
      const result = await riskAssessmentApi.submitResponses('user123', formattedResponses);
      
      setResult(result);
      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to submit responses');
      setLoading(false);
      console.error(err);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!questionnaire) return <div className="p-4 text-center">No questionnaire available</div>;

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Your Risk Profile</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Profile: {result.riskProfile}</h2>
          <p className="mb-4">Based on your responses, we've determined your risk profile is <strong>{result.riskProfile}</strong>.</p>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Recommendations:</h3>
            <ul className="list-disc pl-5">
              <li>Maximum recommended bet size: {result.recommendations.maxBetSize}</li>
              <li>
                Suggested bet types: 
                <ul className="list-circle pl-5 mt-1">
                  {result.recommendations.suggestedBetTypes.map((type: string, index: number) => (
                    <li key={index}>{type}</li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600">
            Your risk profile will be used to personalize betting recommendations throughout the platform.
          </p>
        </div>
        
        <button 
          onClick={() => setSubmitted(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          Retake Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{questionnaire.title}</h1>
      <p className="mb-6">{questionnaire.description}</p>
      
      <form onSubmit={handleSubmit}>
        {questionnaire.questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">
              {index + 1}. {question.text}
            </h2>
            
            <div className="space-y-3">
              {question.options.map(option => (
                <label key={option.id} className="flex items-start">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={responses[question.id] === option.value}
                    onChange={() => handleOptionSelect(question.id, option.value)}
                    className="mt-1 mr-3"
                    required
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        <button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
          disabled={questionnaire.questions.length !== Object.keys(responses).length}
        >
          Submit Assessment
        </button>
      </form>
    </div>
  );
};

export default RiskAssessmentPage;
