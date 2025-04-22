import { useState } from 'react';
import { Vehicle } from '../../types';

// Define the props interface for the component
interface VehicleDiagnosticsPanelProps {
  vehicle: Vehicle;
}

// Define the interface for diagnostic service responses
interface DiagnosticResponse {
  suggestions: string[];
  possibleCauses: string[];
  recommendedActions: string[];
}

// Mock diagnostic service (will be replaced with actual OpenAI integration)
const diagnosticService = {
  getDiagnosticAssistance: async ({ 
    vehicle, 
    symptoms, 
    userDescription, 
    obdData 
  }: { 
    vehicle: Vehicle; 
    symptoms: string[]; 
    userDescription: string;
    obdData?: any;
  }): Promise<DiagnosticResponse> => {
    // This is a mock response - in production this would call the OpenAI API
    console.log('Diagnostic request for:', vehicle.registration);
    console.log('Symptoms:', symptoms);
    console.log('User description:', userDescription);
    console.log('OBD data:', obdData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock diagnostic data
    return {
      suggestions: [
        'Based on your symptoms, this could be related to the fuel system.',
        'The engine misfiring symptoms suggest a potential ignition system issue.',
        'Consider checking the vehicle\'s emission control system.'
      ],
      possibleCauses: [
        'Clogged fuel injectors',
        'Faulty spark plugs or ignition coils',
        'Vacuum leak in the intake manifold',
        'Failing oxygen sensor'
      ],
      recommendedActions: [
        'Schedule a diagnostic scan to check for error codes',
        'Inspect and replace spark plugs if needed',
        'Check fuel pressure and injector performance',
        'Consider a fuel system cleaning service'
      ]
    };
  }
};

// Common symptoms for selection
const commonSymptoms = [
  'Engine misfiring',
  'Check engine light on',
  'Poor fuel economy',
  'Rough idling',
  'Stalling',
  'Difficulty starting',
  'Unusual noises',
  'Loss of power',
  'Overheating',
  'Smoke from exhaust',
  'Vibration when driving',
  'Burning smell'
];

export const VehicleDiagnosticsPanel = ({ vehicle }: VehicleDiagnosticsPanelProps) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [problemDescription, setProblemDescription] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Toggle symptom selection
  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };
  
  // Submit diagnostic request
  const submitDiagnosticRequest = async () => {
    if (selectedSymptoms.length === 0 && !problemDescription) {
      alert('Please select symptoms or describe your problem');
      return;
    }
    
    setIsLoading(true);
    try {
      // Mock OBD data - in production this would come from an OBD-II device
      const obdData = {
        engineRPM: 850,
        vehicleSpeed: 0,
        coolantTemp: 90,
        fuelLevel: 75,
        batteryVoltage: 12.6
      };
      
      const result = await diagnosticService.getDiagnosticAssistance({
        vehicle,
        symptoms: selectedSymptoms,
        userDescription: problemDescription,
        obdData
      });
      
      setDiagnosticResult(result);
    } catch (error) {
      console.error('Error getting diagnostic assistance:', error);
      alert('Failed to get diagnostic assistance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setSelectedSymptoms([]);
    setProblemDescription('');
    setDiagnosticResult(null);
  };
  
  return (
    <div className="space-y-4">
      {!diagnosticResult ? (
        // Input form
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">What symptoms are you experiencing?</h3>
            <p className="text-sm text-gray-500 mb-3">
              Select all that apply to your {vehicle.make} {vehicle.model}
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {commonSymptoms.map(symptom => (
                <div 
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`p-2 border rounded-md cursor-pointer text-sm ${
                    selectedSymptoms.includes(symptom) 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'border-gray-200'
                  }`}
                >
                  {symptom}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Describe the problem</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 h-32"
              placeholder="Provide additional details about the issue you're experiencing..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
            />
          </div>
          
          <button 
            className="gm-btn-primary w-full"
            onClick={submitDiagnosticRequest}
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Get Diagnostic Assistance'}
          </button>
        </>
      ) : (
        // Results display
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Diagnostic Results</h3>
              <button 
                onClick={resetForm}
                className="text-sm text-blue-500"
              >
                Start New Diagnosis
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">AI Analysis</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {diagnosticResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Possible Causes</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {diagnosticResult.possibleCauses.map((cause, index) => (
                    <li key={index} className="text-sm">{cause}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Recommended Actions</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {diagnosticResult.recommendedActions.map((action, index) => (
                    <li key={index} className="text-sm">{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Find a Garage</h3>
            <p className="text-sm text-gray-500 mb-3">
              Connect with a qualified mechanic to address these issues
            </p>
            <button className="gm-btn-primary w-full">
              Find Nearby Garages
            </button>
          </div>
        </>
      )}
    </div>
  );
};
