import { createFileRoute } from "@tanstack/react-router";
import { WorkPage } from "@/components/work-page";

export const Route = createFileRoute("/_authenticated/self-learning")({
  head: () => ({
    meta: [
      { title: "Faculty Self-Learning — StudySync" },
      { name: "description", content: "Track faculty-assigned self-learning tasks, separate from assignments." },
    ],
  }),
  component: () => (
    <WorkPage
      table="self_learning"
      title="Faculty Self-Learning"
      addLabel="New task"
      emptyCopy="No self-learning tasks match your filters yet."
    />
  ),
});
