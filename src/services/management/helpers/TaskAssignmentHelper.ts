/**
 * Helper class to manage Task Assignment History
 * 
 * Tracks:
 * - Who assigned the task
 * - Who it was assigned to
 * - When it was assigned
 * - Previous assignments
 */
export class TaskAssignmentHelper {
  /**
   * Create assignment history record
   * 
   * Note: This should be stored in task_assignments table
   * The table already has: task_id, assigned_to, assigned_by, assigned_at
   * 
   * For full history tracking, we might need:
   * - task_assignment_history table with:
   *   - id
   *   - task_id
   *   - assigned_from (previous user)
   *   - assigned_to (new user)
   *   - assigned_by (who made the change)
   *   - assigned_at (timestamp)
   *   - reason (optional)
   */
  static createAssignmentHistoryRecord(data: {
    taskId: bigint;
    assignedFrom?: bigint; // Previous assignee
    assignedTo: bigint; // New assignee
    assignedBy: bigint; // Who made the assignment
    reason?: string;
  }): any {
    return {
      task_id: data.taskId,
      assigned_from: data.assignedFrom,
      assigned_to: data.assignedTo,
      assigned_by: data.assignedBy,
      reason: data.reason,
      assigned_at: new Date(),
    };
  }

  /**
   * Format assignment history for display
   */
  static formatAssignmentHistory(
    previousAssignee: any,
    newAssignee: any,
    assignedBy: any
  ): string {
    if (previousAssignee) {
      return `Reassigned from ${previousAssignee.name} to ${newAssignee.name} by ${assignedBy.name}`;
    }
    return `Assigned to ${newAssignee.name} by ${assignedBy.name}`;
  }

  /**
   * Get assignment timeline for a task
   * Shows all assignments in chronological order
   */
  static formatAssignmentTimeline(assignments: any[]): string[] {
    return assignments
      .sort((a, b) => new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime())
      .map((a, i) => {
        const date = new Date(a.assigned_at).toLocaleString();
        if (i === 0) {
          return `Initial: Assigned to ${a.assigned_to} by ${a.assigned_by} on ${date}`;
        }
        return `Reassigned to ${a.assigned_to} by ${a.assigned_by} on ${date}`;
      });
  }
}
