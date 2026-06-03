/**
 * Calculates pending and total assignment workload stats from an array of records.
 */
export const calculateAssigneeStats = (entries) => {
    const stats = {};
    entries.forEach((entry) => {
      const assignee = entry.assignedTo || 'Unassigned';
      if (!stats[assignee]) {
        stats[assignee] = { total: 0, pending: 0 };
      }
      stats[assignee].total += 1;
      if (entry.status !== 'Completed' && entry.status !== 'Cancelled') {
        stats[assignee].pending += 1;
      }
    });
    return Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0]));
};