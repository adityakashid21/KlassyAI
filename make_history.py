import os
import random
import subprocess
from datetime import datetime, timedelta

# ✅ Highly realistic commits for a Tuition Management App (React Native + Backend)
klassyai_messages = [
    "initialized React Native project for KlassyAI",
    "setup React Navigation and folder structure",
    "designed teacher and student login UI",
    "created database schema for student batches",
    "working on student attendance tracking UI",
    "integrated backend API for fees collection",
    "fixed state management for dashboard widgets",
    "WIP: offline caching for student records",
    "added filtering for pending fee statuses",
    "debugged token expiration in auth flow",
    "designed UI for adding new tuition batches",
    "refactored API calls for better performance",
    "handled null responses in student list",
    "configured SHA-1 fingerprints for OAuth",
    "setup Play Integrity API for app security",
    "added push notifications for absent students",
    "fixed layout overflow on small mobile screens",
    "updated app icon and splash screen",
    "tested end-to-end fee payment flow",
    "preparing release build for Play Store testing"
]

def ensure_git_repo():
    if not os.path.exists('.git'):
        print("⚙️ Initializing fresh Git repository for KlassyAI...")
        subprocess.run(['git', 'init'], check=True)

def git_commit(message, commit_date, file_name):
    subprocess.run(['git', 'add', file_name], check=True)
    formatted_date = commit_date.strftime('%Y-%m-%dT%H:%M:%S')
    
    env = os.environ.copy()
    env['GIT_COMMITTER_DATE'] = formatted_date
    env['GIT_AUTHOR_DATE'] = formatted_date 
    
    subprocess.run(
        ['git', 'commit', '-m', message, '--date', formatted_date], 
        env=env, 
        check=True,
        stdout=subprocess.DEVNULL
    )

def generate_history():
    ensure_git_repo()
    
    log_file = "dev_log.txt"
    
    # 🗓 Set the date range (e.g., Jan 2026 to August 2026)
    start_date = datetime(2026, 1, 10)
    end_date = datetime(2026, 8, 4) # Till yesterday
    total_days = (end_date - start_date).days
    
    # 🎯 Generate between 140 and 190 random commits
    target_commits = random.randint(140, 190)
    print(f"🎯 Generating {target_commits} genuine-looking commits for KlassyAI...")
    
    commit_timestamps = []
    
    for _ in range(target_commits):
        random_day_offset = random.randint(0, total_days)
        random_hour = random.randint(9, 23)
        random_minute = random.randint(0, 59)
        
        c_date = start_date + timedelta(
            days=random_day_offset, hours=random_hour, minutes=random_minute
        )
        commit_timestamps.append(c_date)
    
    commit_timestamps.sort()
    
    # 1. Create the fake history
    for i, commit_date in enumerate(commit_timestamps, 1):
        message = random.choice(klassyai_messages)
        full_msg = f"{message}"
        
        with open(log_file, "a", encoding="utf-8") as file:
            file.write(f"Work logged on {commit_date.strftime('%d-%b-%Y %H:%M')} - {full_msg}\n")
            
        git_commit(full_msg, commit_date, log_file)
    
    print("\n✅ Past history generated! Now adding your ACTUAL KlassyAI project files...")
    
    # 2. Add all the REAL project files as the final commit (Today's date)
    subprocess.run(['git', 'add', '.'], check=True)
    subprocess.run(['git', 'commit', '-m', 'finalized production build for Play Store release'], check=True)
    
    print("\n🎉 All done! Your KlassyAI project now has a rich commit history.")
    print("Run the push commands to upload to GitHub.")

if __name__ == "__main__":
    generate_history()