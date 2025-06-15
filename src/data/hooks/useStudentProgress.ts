
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch all progress and assignments for a given student.
 * @param studentId ID of the logged-in student.
 */
export const useStudentProgress = (studentId: string | undefined) => {
  // Don't trigger if no studentId
  return useQuery({
    queryKey: ["student-progress", studentId],
    queryFn: async () => {
      if (!studentId) return { assignments: [], progress: [] };
      const [assignRes, progressRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/assignments`).then(res => res.json()),
        fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/progress`).then(res => res.json()),
      ]);
      return {
        assignments: assignRes,
        progress: progressRes.filter((p: any) => p.studentId === studentId)
      }
    },
    enabled: !!studentId
  });
};
