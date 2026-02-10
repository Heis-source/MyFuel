import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

// Replace with your local IP address
const API_URL = 'http://192.168.0.56:3000/apiv1/nearby';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState('fuel'); // 'fuel' or 'electric'

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      fetchNearbyStations(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  const fetchNearbyStations = async (lat, lon) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}?lat=${lat}&lon=${lon}`);
      if (response.data.success) {
        setStations(response.data.results);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // alert("Error fetching data. Ensure you are on the same Wi-Fi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (location) {
        fetchNearbyStations(location.coords.latitude, location.coords.longitude);
    } else {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        fetchNearbyStations(loc.coords.latitude, loc.coords.longitude);
    }
  };

  const getMarkers = () => {
    if (!stations) return [];
    
    if (viewType === 'fuel' && stations.fuelStations) {
      return stations.fuelStations.map((s, index) => ({
        id: `fuel-${index}`,
        title: s['Rótulo'],
        description: `${s['Precio Gasolina 95 E5'] || s['Precio Gasoleo A']}€ - ${s['Dirección']}`,
        coordinate: {
          latitude: s.lat,
          longitude: s.lon,
        },
        type: 'fuel',
        price: s['Precio Gasolina 95 E5'] || s['Precio Gasoleo A']
      }));
    } else if (viewType === 'electric' && stations.chargers) {
      return stations.chargers.map((c, index) => ({
        id: `charger-${index}`,
        title: c.name || 'Cargador',
        description: `${c.connectors[0]?.power}kW - ${c.connectors[0]?.type}`,
        coordinate: {
          latitude: c.latitude,
          longitude: c.longitude,
        },
        type: 'electric',
        power: c.connectors[0]?.power
      }));
    }
    return [];
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={true}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {getMarkers().map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor={marker.type === 'fuel' ? 'orange' : 'green'}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>{errorMsg || 'Localizando...'}</Text>
        </View>
      )}

      {/* Control Panel */}
      <View style={styles.panel}>
        <View style={styles.switchContainer}>
          <TouchableOpacity 
            style={[styles.switchBtn, viewType === 'fuel' && styles.activeBtn]}
            onPress={() => setViewType('fuel')}
          >
            <Text style={[styles.btnText, viewType === 'fuel' && styles.activeText]}>⛽️ Gasolina</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.switchBtn, viewType === 'electric' && styles.activeBtn]}
            onPress={() => setViewType('electric')}
          >
            <Text style={[styles.btnText, viewType === 'electric' && styles.activeText]}>⚡️ Eléctrico</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.refreshText}>🔄 Actualizar Zona</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  panel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeBtn: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  btnText: {
    fontWeight: '600',
    color: '#64748b',
  },
  activeText: {
    color: '#1e3a8a',
  },
  refreshBtn: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
