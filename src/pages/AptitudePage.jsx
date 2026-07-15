import { usePathname } from "../navigation";
import StudentAssessments from "./aptitude/StudentAssessments";
import StartAssessment from "./aptitude/StartAssessment";
import StudentResults from "./aptitude/StudentResults";
import ResultDetails from "./aptitude/ResultDetails";

export default function AptitudePage() {
  const pathname = usePathname();
  const startMatch = pathname.match(/^\/aptitude\/([^/]+)\/start$/);
  const resultMatch = pathname.match(/^\/aptitude\/results\/(.+)$/);

  if (startMatch) {
    return <StartAssessment assessmentId={startMatch[1]} />;
  }

  if (resultMatch) {
    return <ResultDetails attemptId={resultMatch[1]} />;
  }

  if (pathname === "/aptitude/results") {
    return <StudentResults />;
  }

  return <StudentAssessments />;
}
