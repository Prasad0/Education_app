import { useState, useEffect, useCallback } from 'react';
import { api, getApiUrl, API_CONFIG } from '../config/api';

export interface ChoiceItem {
  id: number;
  code: string;
  name: string;
}

export interface ChoicesResponse {
  streams: ChoiceItem[];
  standards: ChoiceItem[];
  boards: ChoiceItem[];
  target_exams: ChoiceItem[];
}

const emptyChoices: ChoicesResponse = {
  streams: [],
  standards: [],
  boards: [],
  target_exams: [],
};

/**
 * Fetches stream, standard, board, and target_exam choices from the API.
 * Use these for student/parent onboarding and edit profile (dropdowns send code to API).
 */
export function useChoices() {
  const [choices, setChoices] = useState<ChoicesResponse>(emptyChoices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = getApiUrl(API_CONFIG.ENDPOINTS.CHOICES);
      const response = await api.get<ChoicesResponse>(url);
      setChoices(response.data || emptyChoices);
    } catch (err: any) {
      setError(err?.message || 'Failed to load options');
      setChoices(emptyChoices);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChoices();
  }, [fetchChoices]);

  /** For Pickers: { label: name, value: code } */
  const streamsForPicker = choices.streams.map((o) => ({ label: o.name, value: o.code }));
  const standardsForPicker = choices.standards.map((o) => ({ label: o.name, value: o.code }));
  const boardsForPicker = choices.boards.map((o) => ({ label: o.name, value: o.code }));
  const targetExamsForPicker = choices.target_exams.map((o) => ({ label: o.name, value: o.code }));

  return {
    choices,
    streamsForPicker,
    standardsForPicker,
    boardsForPicker,
    targetExamsForPicker,
    loading,
    error,
    refetch: fetchChoices,
  };
}
