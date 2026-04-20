import { TaskModel } from '../../../models/management/Task';
import { Task, TaskRelation } from '../../../types/management';

/**
 * Helper class to manage Task Dependencies
 * 
 * Prevents:
 * - Circular dependencies (A depends on B, B depends on A)
 * - Starting tasks that have incomplete dependencies
 */
export class DependencyHelper {
  /**
   * Validate for Circular Dependencies
   * 
   * Algorithm: DFS (Depth-First Search)
   * - Start from the new dependency
   * - Check if it leads back to the original task
   */
  static async validateNoCircularDependency(
    taskId: bigint,
    relatedTaskId: bigint
  ): Promise<{ isValid: boolean; reason?: string }> {
    if (taskId === relatedTaskId) {
      return {
        isValid: false,
        reason: 'Task cannot depend on itself',
      };
    }

    // Check if relatedTask already depends on taskId (direct circular)
    const relatedRelations = await TaskModel.getRelations(relatedTaskId);
    const directCircular = relatedRelations.some(
      r => r.related_to_id === taskId && r.related_to_type === 'depends_on'
    );

    if (directCircular) {
      return {
        isValid: false,
        reason: 'This would create a circular dependency',
      };
    }

    // Check for indirect circular dependencies (DFS)
    const visited = new Set<bigint>();
    const hasCircular = await this.dfsCheckCircular(relatedTaskId, taskId, visited);

    if (hasCircular) {
      return {
        isValid: false,
        reason: 'This would create an indirect circular dependency',
      };
    }

    return { isValid: true };
  }

  /**
   * DFS to check for circular dependencies
   */
  private static async dfsCheckCircular(
    currentTaskId: bigint,
    targetTaskId: bigint,
    visited: Set<bigint>
  ): Promise<boolean> {
    if (visited.has(currentTaskId)) {
      return false; // Already visited, no cycle from this path
    }

    visited.add(currentTaskId);

    const relations = await TaskModel.getRelations(currentTaskId);
    const dependencies = relations.filter(r => r.related_to_type === 'depends_on');

    for (const dep of dependencies) {
      if (dep.related_to_id === targetTaskId) {
        return true; // Found circular dependency
      }

      if (await this.dfsCheckCircular(dep.related_to_id!, targetTaskId, visited)) {
        return true; // Circular dependency found in deeper level
      }
    }

    return false;
  }

  /**
   * Get all tasks that this task depends on (recursively)
   */
  static async getAllDependencies(taskId: bigint): Promise<Task[]> {
    const dependencies: Task[] = [];
    const visited = new Set<bigint>();

    await this.collectDependencies(taskId, dependencies, visited);

    return dependencies;
  }

  /**
   * Recursively collect all dependencies
   */
  private static async collectDependencies(
    taskId: bigint,
    dependencies: Task[],
    visited: Set<bigint>
  ): Promise<void> {
    if (visited.has(taskId)) {
      return;
    }

    visited.add(taskId);

    const relations = await TaskModel.getRelations(taskId);
    const directDeps = relations.filter(r => r.related_to_type === 'depends_on');

    for (const dep of directDeps) {
      const depTask = await TaskModel.findById(dep.related_to_id!);
      if (depTask) {
        dependencies.push(depTask);
        await this.collectDependencies(dep.related_to_id!, dependencies, visited);
      }
    }
  }

  /**
   * Get all tasks that depend on this task (reverse dependencies)
   */
  static async getAllDependents(taskId: bigint): Promise<Task[]> {
    const allTasks = await TaskModel.findAll(10000, 0);
    const dependents: Task[] = [];

    for (const task of allTasks) {
      const relations = await TaskModel.getRelations(task.id);
      const isDependentOnThis = relations.some(
        r => r.related_to_id === taskId && r.related_to_type === 'depends_on'
      );

      if (isDependentOnThis) {
        dependents.push(task);
      }
    }

    return dependents;
  }

  /**
   * Check if task can start (all dependencies are done)
   */
  static async canTaskStart(taskId: bigint): Promise<{
    canStart: boolean;
    blockedBy: Task[];
    reason?: string;
  }> {
    const dependencies = await this.getAllDependencies(taskId);
    
    // Get Done status ID dynamically
    const doneStatusId = await this.getDoneStatusId();
    
    const blockedBy = dependencies.filter(
      d => d.status_id !== doneStatusId
    );

    return {
      canStart: blockedBy.length === 0,
      blockedBy,
      reason: blockedBy.length > 0
        ? `Task blocked by ${blockedBy.length} incomplete dependencies`
        : undefined,
    };
  }

  /**
   * Get Done status ID from database (cached)
   */
  private static doneStatusIdCache: bigint | null = null;

  private static async getDoneStatusId(): Promise<bigint> {
    if (this.doneStatusIdCache !== null) {
      return this.doneStatusIdCache;
    }

    const statuses = await TaskModel.getStatuses();
    const doneStatus = statuses.find(s => s.name === 'Done');

    if (!doneStatus) {
      throw new Error('Done status not found in database');
    }

    this.doneStatusIdCache = doneStatus.id;
    return doneStatus.id;
  }

  /**
   * Get dependency chain as string (for logging/debugging)
   */
  static async getDependencyChain(taskId: bigint): Promise<string> {
    const dependencies = await this.getAllDependencies(taskId);

    if (dependencies.length === 0) {
      return 'No dependencies';
    }

    const chain = dependencies
      .map((d, i) => `${i + 1}. ${d.title} (${d.status_id})`)
      .join(' → ');

    return chain;
  }
}
