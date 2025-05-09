from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

api_key = os.getenv('WEATHER_API_KEY')
base = "http://api.weatherapi.com/v1"

@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/api/current', methods=['GET'])
def get_current_weather():
    location = request.args.get('location', 'auto:ip')
    try:
        r = requests.get(f"{base}/current.json", params={"key": api_key, "q": location, "aqi": "yes"})
        r.raise_for_status()
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    location = request.args.get('location', 'auto:ip')
    days = request.args.get('days', 7)
    try:
        r = requests.get(f"{base}/forecast.json", 
                         params={"key": api_key, "q": location, "days": days, "aqi": "yes", "alerts": "yes"})
        r.raise_for_status()
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/location', methods=['GET'])
def get_location_info():
    try:
        # Use current.json with "q=auto:ip" to get location by IP
        r = requests.get(f"{base}/current.json", params={"key": api_key, "q": "auto:ip"})
        r.raise_for_status()
        
        # Extract location data from the response
        data = r.json()
        location = data["location"]
        
        # Return the location information
        return jsonify({
            "city": location["name"],
            "region": location["region"],
            "country_name": location["country"],
            "latitude": location["lat"],
            "longitude": location["lon"],
            "localtime": location["localtime"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/air-quality', methods=['GET'])
def get_air_quality():
    location = request.args.get('location', 'auto:ip')
    try:
        r = requests.get(f"{base}/current.json", params={"key": api_key, "q": location, "aqi": "yes"})
        r.raise_for_status()
        data = r.json()
        
        # Extract air quality data
        if 'air_quality' in data['current']:
            air_quality = data['current']['air_quality']
            return jsonify({
                "co": air_quality.get("co"),
                "no2": air_quality.get("no2"),
                "o3": air_quality.get("o3"),
                "so2": air_quality.get("so2"),
                "pm2_5": air_quality.get("pm2_5"),
                "pm10": air_quality.get("pm10"),
                "us-epa-index": air_quality.get("us-epa-index"),
                "gb-defra-index": air_quality.get("gb-defra-index")
            })
        else:
            return jsonify({"error": "No air quality data available"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)