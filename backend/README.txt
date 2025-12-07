cd backend 

python -m venv venv

venv\scripts\activate


then install dependencies 


pip install -r requirements.txt

------- dependencies so far 

pip install flask flask-cors flask-sqlalchemy python-dotenv

will be kept under requirements.txt, which we can later run if we add more to have the same enviroment 

pip freeze > requirements.txt -- to store dependencies/packages

----

to run frontend  

cd frontend
 
npm install


npm run dev 


databse url 

has to be the complete path where it is stored 
