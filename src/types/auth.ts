
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher';
  class?: string;
  section?: string;
}
