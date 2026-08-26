import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("HermesSelfTuner")


ALLOWED_SYSTEM_PACKAGES = {
    "ping": "iputils-ping",
    "traceroute": "traceroute",
    "nmap": "nmap",
    "curl": "curl",
    "wget": "wget",
    "htop": "htop",
    "net-tools": "net-tools",
    "dnsutils": "dnsutils",
}

ALLOWED_PYTHON_PACKAGES = {
    "pandas": "pandas",
    "numpy": "numpy",
    "matplotlib": "matplotlib",
    "seaborn": "seaborn",
    "scipy": "scipy",
    "requests": "requests",
    "httpx": "httpx",
    "yfinance": "yfinance",
    "bs4": "beautifulsoup4",
}


def install_python_package(package_name: str) -> bool:
    try:
        logger.info(f"Auto-Tuner: Instalando paquete Python '{package_name}'...")
        res = subprocess.run(
            [sys.executable, "-m", "pip", "install", package_name],
            capture_output=True,
            text=True,
            timeout=120
        )
        return res.returncode == 0
    except Exception as e:
        logger.error(f"Auto-Tuner: Fallo al instalar paquete Python '{package_name}': {e}")
        return False


def install_system_package(package_name: str) -> bool:
    try:
        logger.info(f"Auto-Tuner: Instalando herramienta de sistema '{package_name}'...")
        res = subprocess.run(
            ["apt-get", "update"],
            capture_output=True,
            text=True,
            timeout=60
        )
        res_inst = subprocess.run(
            ["apt-get", "install", "-y", "--no-install-recommends", package_name],
            capture_output=True,
            text=True,
            timeout=120
        )
        return res_inst.returncode == 0
    except Exception as e:
        logger.error(f"Auto-Tuner: Fallo al instalar binario del sistema '{package_name}': {e}")
        return False


def auto_tune_missing_tool(error_message: str) -> str:
    """
    Analiza el mensaje de error y si detecta falta de herramienta o paquete, lo instala dinámicamente.
    """
    err_lower = error_message.lower()

    # Check for missing Python modules
    for mod_name, pip_name in ALLOWED_PYTHON_PACKAGES.items():
        if f"no module named '{mod_name}'" in err_lower or f"modulenotfounderror: no module named '{mod_name}'" in err_lower:
            if install_python_package(pip_name):
                return f"🔧 *Auto-Tuner*: Se instaló automáticamente el paquete Python `{pip_name}`."

    # Check for missing system binaries
    for cmd_name, sys_pkg in ALLOWED_SYSTEM_PACKAGES.items():
        if f"no such file or directory: '{cmd_name}'" in err_lower or f"command not found: {cmd_name}" in err_lower:
            if install_system_package(sys_pkg):
                return f"🔧 *Auto-Tuner*: Se instaló automáticamente la herramienta del sistema `{sys_pkg}`."

    return ""
