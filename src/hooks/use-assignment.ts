
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAssignments, Assignment } from '@/contexts/AssignmentContext';

export const useAssignment = () => {
  const [searchParams] = useSearchParams();
  const { assignments } = useAssignments();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assignmentId = searchParams.get('assignmentId');

  useEffect(() => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    try {
      const foundAssignment = assignments.find(a => a.id === assignmentId);
      if (foundAssignment) {
        setAssignment(foundAssignment);
        setError(null);
      } else {
        setError('Assignment not found');
      }
    } catch (err) {
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, assignments]);

  return {
    assignment,
    loading,
    error,
    isAssignmentMode: !!assignmentId
  };
};
