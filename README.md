# ACDB
A database & website for Animal Crossing: City Folk

Currently provides:

* Database housing fish & bug info for Animal Crossing: City Folk
* REST API for querying the database
* Frontend providing a checklist for bugs & fish caught

## Dependencies
* NodeJS & npm
* Python 2.7 & pip
* virtualenv

## Linux Setup
```
virtualenv env
source env/bin/activate
pip install -r requirements.txt
npm install
grunt setup
```

## Usage
### Production
Run `grunt package` to compile the frontend and have the resulting files dropped into Django's `STATIC_ROOT` folder. In `acdb/acdb/settings.py`, make sure to change `DEBUG = False` and `ALLOWED_HOSTS = ['your_domain.com']`. You're now free to run the server through `python acdb/manage.py runserver`, but a better a setup would probably involve setting up Nginx/Apache through WSGI.
### Development
Run `grunt runserver` to start up the debug Django server with a watch task setup to recompile the frontend automatically whenever changes are made.

## License
[MIT license](../master/LICENSE)
