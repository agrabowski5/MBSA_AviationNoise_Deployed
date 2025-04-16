import os
import json
import glob
from shapely.geometry import Polygon, MultiPolygon, mapping, box
from shapely.ops import unary_union
import shutil
import re
import sys

def generate_town_boundaries(data_folder, output_file):
    """
    Generate town boundaries from parcel data and save as GeoJSON.
    
    Parameters:
    - data_folder: Path to folder containing noise_by_town directory
    - output_file: Path to save the output GeoJSON file
    """
    print(f"Generating town boundaries from {data_folder}")
    
    # Path to the town directories
    towns_dir = os.path.join(data_folder, "parcels", "noise_by_town")
    
    # Check that the directory exists
    if not os.path.exists(towns_dir):
        print(f"Error: Directory {towns_dir} does not exist")
        return
    
    # Get all directory names as towns (not just those in directory_map.json)
    town_ids = [d for d in os.listdir(towns_dir) if os.path.isdir(os.path.join(towns_dir, d)) and not d.startswith('.')]
    print(f"Found {len(town_ids)} town directories")
    
    # Create features list for the town boundaries
    town_features = []
    
    # Process each town directory
    for town_id in town_ids:
        print(f"Processing town {town_id}")
        town_dir = os.path.join(towns_dir, town_id)
        
        # Get all GeoJSON files for this town
        geojson_files = glob.glob(os.path.join(town_dir, "*.geojson"))
        if not geojson_files:
            print(f"No GeoJSON files found in {town_dir}")
            continue
        
        # Check if this town has noise data (non-No_Data files)
        has_noise_data = False
        noise_files = []
        no_data_files = []
        
        for file_path in geojson_files:
            file_name = os.path.basename(file_path)
            if file_name.startswith('No_Data'):
                no_data_files.append(file_path)
            else:
                has_noise_data = True
                noise_files.append(file_path)
        
        print(f"Town {town_id}: Has noise data: {has_noise_data}, Noise files: {len(noise_files)}, No_Data files: {len(no_data_files)}")
        
        # Determine which files to use for geometry extraction
        files_to_process = noise_files if has_noise_data else no_data_files
        
        if not files_to_process:
            print(f"No valid files to process for town {town_id}")
            continue
        
        # Process all GeoJSON files to extract boundaries
        all_polygons = []
        for file_path in files_to_process:
            try:
                with open(file_path, 'r') as f:
                    geojson = json.load(f)
                    
                if 'features' not in geojson or not geojson['features']:
                    continue
                    
                # Extract coordinates from features
                for feature in geojson['features']:
                    if not feature.get('geometry') or not feature['geometry'].get('coordinates'):
                        continue
                        
                    geom_type = feature['geometry']['type']
                    coords = feature['geometry']['coordinates']
                    
                    if geom_type == 'Polygon':
                        all_polygons.append(Polygon(coords[0]))
                    elif geom_type == 'MultiPolygon':
                        for polygon_coords in coords:
                            all_polygons.append(Polygon(polygon_coords[0]))
                    elif geom_type == 'Point':  # Also handle point geometries
                        # For points, we'll add a small buffer around them
                        point = coords
                        buffer_size = 0.001  # Small buffer
                        box_coords = [
                            [point[0] - buffer_size, point[1] - buffer_size],
                            [point[0] + buffer_size, point[1] - buffer_size],
                            [point[0] + buffer_size, point[1] + buffer_size],
                            [point[0] - buffer_size, point[1] + buffer_size],
                            [point[0] - buffer_size, point[1] - buffer_size]
                        ]
                        all_polygons.append(Polygon(box_coords))
            except Exception as e:
                print(f"Error processing file {file_path}: {str(e)}")
        
        if not all_polygons:
            print(f"No valid geometries found for town {town_id}")
            continue
            
        try:
            # Create a buffer around all polygons and dissolve them
            buffered = unary_union([p.buffer(0.001) for p in all_polygons])
            simplified = buffered.simplify(0.001)
            
            # Get town name from town_id (assuming it has a format like "Concord-012345")
            town_name = town_id
            if '-' in town_id:
                town_name = town_id.split('-')[0]
            
            # Create the town feature
            town_feature = {
                'type': 'Feature',
                'properties': {
                    'TOWN_ID': town_id,
                    'NAME': town_name,
                    'HAS_NOISE_DATA': has_noise_data,
                    'HAS_DATA': True  # All towns have some data (No_Data is still data)
                },
                'geometry': mapping(simplified)
            }
            
            town_features.append(town_feature)
            print(f"Added boundary for town {town_id}")
            
        except Exception as e:
            print(f"Error creating boundary for town {town_id}: {str(e)}")
    
    # Create the final GeoJSON object
    towns_geojson = {
        'type': 'FeatureCollection',
        'features': town_features
    }
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Save to output file
    with open(output_file, 'w') as f:
        json.dump(towns_geojson, f)
        
    print(f"Town boundaries saved to {output_file}")
    print(f"Generated {len(town_features)} town boundaries")

if __name__ == "__main__":
    # Set default paths
    data_folder = os.path.join("static", "data")
    output_file = os.path.join("static", "data", "town_boundaries.geojson")
    
    # Allow command line arguments to override defaults
    if len(sys.argv) > 1:
        data_folder = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
        
    generate_town_boundaries(data_folder, output_file)