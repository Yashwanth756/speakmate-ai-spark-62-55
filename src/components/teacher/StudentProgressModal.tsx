import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { StudentProgress, Assignment } from "@/contexts/AssignmentContext";

interface StudentProgressModalProps {
  open: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    class: string;
    section: string;
  } | null;
  studentProgress: StudentProgress[];
  assignments: Assignment[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "in-progress":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "pending":
    default:
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

export const StudentProgressModal: React.FC<StudentProgressModalProps> = ({
  open,
  onClose,
  student,
  studentProgress,
  assignments
}) => {
  if (!student) return null;

  const studentAssignmentProgress = assignments.map(a => {
    const progress = studentProgress.find(
      p => p.assignmentId === a.id && p.studentId === student.id
    );
    return { assignment: a, progress };
  });

  const totalAssignments = assignments.length;
  const completedCount = studentAssignmentProgress.filter(
    ap => ap.progress && ap.progress.status === "completed"
  ).length;
  const overallProgress = totalAssignments
    ? Math.round((completedCount / totalAssignments) * 100)
    : 0;
  const avgScore =
    studentAssignmentProgress.length > 0
      ? Math.round(
          studentAssignmentProgress.reduce(
            (sum, ap) => sum + (ap.progress?.bestScore || 0),
            0
          ) / studentAssignmentProgress.length
        )
      : 0;
  const totalTime =
    studentAssignmentProgress.reduce(
      (sum, ap) => sum + (ap.progress?.timeSpent || 0),
      0
    );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>
            {student.name} ({student.class} - {student.section})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div>
              <p className="font-bold">Username:</p>
              <p className="text-muted-foreground">@{student.id}</p>
            </div>
            <div>
              <Badge>
                Progress: {overallProgress}%
              </Badge>
            </div>
            <div>
              <Badge>
                Avg Score: {avgScore}%
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Total Time: {totalTime}m</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Assignment Details</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Best Score</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAssignmentProgress.map(({ assignment, progress }) => (
                    <tr key={assignment.id} className="border-b">
                      <td className="p-2">{assignment.title}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(progress?.status || "pending")}
                          <span className="capitalize">
                            {progress ? progress.status : "pending"}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        {progress ? (
                          <Badge
                            variant="outline"
                            className={getScoreColor(progress.bestScore)}
                          >
                            {progress.bestScore}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {progress ? (
                          <span>{progress.timeSpent}m</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {studentAssignmentProgress.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted-foreground p-2">
                        No assignments assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <DialogClose asChild>
          <button className="mt-3 w-full btn btn-primary py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition">Close</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
