# How to preview before publishing

If you know how to start a HTTP server in your machine, just do as usual. The root directory can be found in "Generated Successfully" modal.

If you don't know how to start a HTTP server:

- **For Linux / macOS users**:
  1. open a Terminal
  2. `cd <output-dir>`(`<output-dir>`can be found in "Generated Successfully" modal)
  3. `python -V` to find out which version of Python on your machine. If fail, try `python3 -V` or `py -V`
  4. if your Python version is 2.x, use `python -m SimpleHTTPServer`; otherwise, use `python3 -m http.server`
  5. open a browser, visit http://localhost:8000 to preview
- **For Window users**:
  1.  Go to [python.org](https://www.python.org/downloads/) to download a python3 installer
  2.  Run the installer. On installer page, make sure you check the "Add Python 3.xxx to PATH" checkbox
  3.  After installing, open CMD, and type in `cd <output-dir>`(`<output-dir>`can be found in "Generated Successfully" modal)
  4.  `python3 -m http.server`
  5.  open a browser, visit http://localhost:8000 to preview
