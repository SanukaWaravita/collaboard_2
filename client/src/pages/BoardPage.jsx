import BoardHeader from "../components/BoardHeader";
import TaskColumn from "../components/TaskColumn";
import { mockTasks } from "../data/mockTasks";

function BoardPage() {
  return (
    <main className="board-page">
      <BoardHeader
        boardName="CollabBoard Development"
        taskCount={mockTasks.length}
      />

      <div className="task-board">
        <TaskColumn
          title="To Do"
          status="todo"
          tasks={mockTasks}
        />

        <TaskColumn
          title="Doing"
          status="doing"
          tasks={mockTasks}
        />

        <TaskColumn
          title="Done"
          status="done"
          tasks={mockTasks}
        />
      </div>
    </main>
  );
}

export default BoardPage;
