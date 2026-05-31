import { existsSync } from 'node:fs';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/run-android-gradle.mjs <gradle-task...>');
  process.exit(1);
}

const root = process.cwd();
const androidDir = path.join(root, 'android');
const javaHome = resolveJdk21();

if (!javaHome) {
  console.error('JDK 21 is required for Android release/debug builds.');
  console.error('Install Temurin 21 or Homebrew openjdk@21, or set JAVA_HOME to a JDK 21 home.');
  console.error('The unversioned Homebrew openjdk may point to a newer JDK that Gradle cannot run.');
  process.exit(1);
}

const child = spawn('./gradlew', args, {
  cwd: androidDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    GRADLE_USER_HOME: process.env.GRADLE_USER_HOME ?? '/private/tmp/arrow-gradle-cache'
  }
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

function resolveJdk21() {
  const candidates = [
    process.env.JAVA_HOME,
    javaHomeFromMac('21'),
    '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home',
    '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
    '/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home'
  ].filter(Boolean);

  return candidates.find((candidate) => candidate && existsSync(candidate) && javaMajor(candidate) === 21);
}

function javaHomeFromMac(version) {
  try {
    return execFileSync('/usr/libexec/java_home', ['-v', version], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return undefined;
  }
}

function javaMajor(javaHome) {
  const result = spawnSync(path.join(javaHome, 'bin', 'java'), ['-version'], {
    encoding: 'utf8'
  });
  return parseJavaMajor(`${result.stdout ?? ''}\n${result.stderr ?? ''}`);
}

function parseJavaMajor(versionOutput) {
  const match = versionOutput.match(/version "(\d+)(?:\.\d+)?/);
  return match ? Number(match[1]) : 0;
}
