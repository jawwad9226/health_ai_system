import subprocess
import os
import sys
import webbrowser
import time
from rich.console import Console

console = Console()

def start_backend():
    """Start the Flask backend server"""
    console.print("[bold green]Starting backend server...[/bold green]")
    subprocess.Popen([sys.executable, 'backend/run.py'])

def start_frontend():
    """Start the React frontend"""
    console.print("[bold green]Starting frontend application...[/bold green]")
    os.chdir('frontend')
    subprocess.Popen(['npm', 'start'])
    # Wait a moment and then open the browser
    time.sleep(3)
    webbrowser.open('http://localhost:3000')

def main():
    """Main function to start the Health AI System"""
    console.print("""
[bold blue]Welcome to Health AI System[/bold blue]
Starting application...
    """)
    
    try:
        # Start backend first
        start_backend()
        # Give the backend a moment to start
        time.sleep(2)
        # Then start frontend
        start_frontend()
        
        console.print("\n[bold green]Application started successfully![/bold green]")
        console.print("The application should open in your default browser.")
        console.print("If it doesn't open automatically, please visit: [link]http://localhost:3000[/link]")
        
    except Exception as e:
        console.print(f"[bold red]Error starting application: {str(e)}[/bold red]")
        sys.exit(1)

if __name__ == "__main__":
    main()
