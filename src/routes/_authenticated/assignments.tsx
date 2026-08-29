import { createFileRoute } from "@tanstack/react-router";
import { WorkPage } from "@/components/work-page";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — StudySync" },
      { name: "description", content: "Track and manage subject assignments with due dates and priorities." },
    ],
  }),
  component: () => (
    <WorkPage
      table="assignments"
      title="Assignments"
      addLabel="New assignment"
      emptyCopy="No assignments match your filters yet."
    />
  ),
});
