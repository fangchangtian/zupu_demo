// Claude Code WorktreeCreate hook
// Reads hook JSON from stdin, creates a git worktree
const { execSync } = require('child_process');
const path = require('path');

let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  const input = JSON.parse(data);
  const cwd = input.cwd;
  const name = input.name;
  const worktreeDir = path.join(cwd, '.claude', 'worktrees', name);
  const branch = 'claude-' + name;

  try {
    execSync(
      `git worktree add "${worktreeDir}" -b "${branch}"`,
      { cwd, encoding: 'utf8', stdio: 'ignore' }
    );
  } catch (e) {
    // Worktree might already exist — ok, reuse
  }
  // CRITICAL: only the worktree directory path on stdout — Claude Code uses this as the chdir target
  console.log(worktreeDir);
});
