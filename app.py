from flask import Flask, render_template
app = Flask(__name__, template_folder='templates')

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/education")
def education():
    return render_template("education.html")

@app.route("/projects")
def projects():
    return render_template("projects.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0', port=54088)