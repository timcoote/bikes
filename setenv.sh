# run this as . ./setenv.sh to get the export to work
export `heroku config|tail -1|sed 's/: /=/'`
