# simplified_noise_generator.py
import os
import json
import random

# Get the directory where the script is located
base_dir = os.path.dirname(os.path.abspath(__file__))
code_dir = base_dir

# Build absolute paths
noise_dir = os.path.join(code_dir, 'static', 'data', 'parcels', 'noise_by_town')
output_file = os.path.join(code_dir, 'static', 'data', 'parcels', 'simplified_noise_map.geojson')

print(f"Looking for directory_map.json in: {noise_dir}")

# Read the directory map
with open(os.path.join(noise_dir, 'directory_map.json'), 'r') as f:
    directory_map = json.load(f)

# Create a feature collection to hold the simplified features
simplified_features = {
    "type": "FeatureCollection",
    "features": []
}

# Track statistics
processed_towns = 0
towns_with_features = 0
total_features_added = 0
missing_files = 0
error_files = 0
colors_found = set()

# Process each town and sample features from each noise level
total_towns = len(directory_map)
print(f"Processing {total_towns} towns...")

# Check if the directory contains town folders
town_folders = [f for f in os.listdir(noise_dir) if os.path.isdir(os.path.join(noise_dir, f))]
print(f"Found {len(town_folders)} town folders in noise directory")

# Check if any folders in directory_map don't exist on disk
missing_town_folders = []
for town_id in directory_map.keys():
    if town_id not in town_folders:
        missing_town_folders.append(town_id)

if missing_town_folders:
    print(f"Warning: {len(missing_town_folders)} towns in directory_map don't exist on disk: {', '.join(missing_town_folders[:10])}...")

for i, (town_id, files) in enumerate(directory_map.items()):
    if i % 10 == 0:
        print(f"Processing town {i+1}/{total_towns}...")
    
    town_has_features = False
    
    for file_name in files:
        if file_name.startswith('No_Data'):
            continue
        
        color_name = file_name.replace('.geojson', '')
        file_path = os.path.join(noise_dir, town_id, file_name)
        
        if not os.path.exists(file_path):
            print(f"Warning: File not found: {file_path}")
            missing_files += 1
            continue
        
        try:
            # Read GeoJSON directly with json module
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Get features - up to 10 per file
            features = data.get('features', [])
            if not features:
                continue
                
            # Sample a reasonable number of features to prevent overwhelming the map
            sample_size = min(10, len(features))
            if len(features) > sample_size:
                sampled_features = random.sample(features, sample_size)
            else:
                sampled_features = features
            
            # Add noise level to properties and add to simplified collection
            for feature in sampled_features:
                if feature and feature.get('geometry') and feature['geometry'].get('coordinates'):
                    # Simple validation - skip if coordinates array is empty
                    if len(str(feature['geometry']['coordinates'])) < 10:
                        continue
                        
                    # Add the noise level to properties
                    if not feature.get('properties'):
                        feature['properties'] = {}
                    
                    feature['properties']['noiseLevel'] = color_name
                    feature['properties']['townId'] = town_id
                    
                    # Add to simplified collection
                    simplified_features['features'].append(feature)
                    town_has_features = True
                    total_features_added += 1
                    colors_found.add(color_name)
            
            print(f"Added {len(sampled_features)} features for {town_id} - {color_name}")
            
        except Exception as error:
            print(f"Error processing {file_name} for town {town_id}: {error}")
            error_files += 1
    
    if town_has_features:
        towns_with_features += 1
    
    processed_towns += 1
    
    # Save progress every 20 towns in case the script crashes
    if i % 20 == 0 and i > 0:
        temp_output = output_file.replace('.geojson', f'_progress_{i}_towns.geojson')
        os.makedirs(os.path.dirname(temp_output), exist_ok=True)
        with open(temp_output, 'w') as f:
            json.dump(simplified_features, f)
        print(f"Saved progress with {len(simplified_features['features'])} features after processing {i} towns")

# Create output directory if it doesn't exist
os.makedirs(os.path.dirname(output_file), exist_ok=True)

# Write the output
with open(output_file, 'w') as f:
    json.dump(simplified_features, f)

print(f"Created simplified noise map at {output_file} with {len(simplified_features['features'])} features")
print(f"Processed {processed_towns} towns, {towns_with_features} towns with features, {total_features_added} total features added")
print(f"Missing files: {missing_files}, Error files: {error_files}")
print(f"Colors found: {', '.join(colors_found)}")