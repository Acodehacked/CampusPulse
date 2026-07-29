import { CreateIssueForm } from "@/components/features/issues/create-issue-form";

export const metadata = { title: "Report an Issue | CampusPulse" };

export default function NewIssuePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Report an issue</h1>
        <p className="text-sm text-muted-foreground">
          Give enough detail that someone unfamiliar with the situation could confirm it.
        </p>
      </div>
      <CreateIssueForm />
    </div>
  );
}
