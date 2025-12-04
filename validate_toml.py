import sys
try:
    import tomllib
except ImportError:
    print("Python 3.11+ required for tomllib. Trying tomli...")
    try:
        import tomli as tomllib
    except ImportError:
        print("Neither tomllib nor tomli available. Cannot validate TOML.")
        sys.exit(1)

try:
    with open("netlify.toml", "rb") as f:
        content = f.read()
    tomllib.loads(content)
    print("netlify.toml parsed OK - syntax is valid!")
except Exception as e:
    print(f"TOML syntax error: {str(e)}")
    sys.exit(1)