@echo off
REM ============================================================================
REM setup-dev.bat - Automatic development setup for Windows
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           VET-SHOP BACKEND - DEVELOPMENT SETUP                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if venv exists
if not exist "venv\" (
    echo [1/5] Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo [1/5] Virtual environment already exists
)

echo.
echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat
echo ✅ Virtual environment activated

echo.
echo [3/5] Installing dependencies...
pip install -q -r requirements.txt
echo ✅ Dependencies installed

echo.
echo [4/5] Running migrations...
python manage.py migrate --noinput
echo ✅ Migrations completed

echo.
echo [5/5] Creating superuser...
echo.
echo Enter superuser credentials:
python manage.py createsuperuser
echo ✅ Superuser created

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SETUP COMPLETE! ✅                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Next steps:
echo 1. Create .env file with your Neon DATABASE_URL and Stripe keys
echo    (copy .env.template to .env and edit)
echo.
echo 2. Start the server:
echo    python manage.py runserver
echo.
echo 3. Access:
echo    - API: http://127.0.0.1:8000/
echo    - Admin: http://127.0.0.1:8000/admin/
echo.
pause
