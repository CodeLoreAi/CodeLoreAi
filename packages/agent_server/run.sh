#!/bin/bash

VENV_NAME="venv"

activate_venv() {
  source "$VENV_NAME/bin/activate"
}

if [[ -n "$VIRTUAL_ENV" ]]; then
  echo "✅ Already inside a virtual environment."
  echo "🚀 Running app.py..."
  python app.py
  exit 0
fi

if [[ ! -d "./$VENV_NAME" ]]; then
  echo "📦 Creating virtual environment in current directory..."
  python3 -m venv "$VENV_NAME"

  echo "🔌 Activating virtual environment..."
  activate_venv

  echo "📥 Installing dependencies..."
  pip install --upgrade pip
  pip install chromadb sentence-transformers flask
else
  echo "🔌 Activating existing virtual environment..."
  activate_venv
fi

echo "🚀 Running app.py..."
python app.py
