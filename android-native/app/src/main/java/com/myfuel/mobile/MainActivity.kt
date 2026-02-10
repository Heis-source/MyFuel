package com.myfuel.mobile

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup
import com.myfuel.mobile.models.Charger
import com.myfuel.mobile.models.FuelStation
import com.myfuel.mobile.viewmodel.MainViewModel
import com.myfuel.mobile.viewmodel.UiState
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class MainActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var map: GoogleMap
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var toggleGroup: MaterialButtonToggleGroup
    private lateinit var refreshButton: MaterialButton
    private lateinit var loadingView: View
    
    private val viewModel: MainViewModel by viewModels()
    
    private var currentLocation: Location? = null
    // We keep these to toggle views instantly without re-fetching if data is same
    private var currentFuelStations: List<FuelStation> = emptyList()
    private var currentChargers: List<Charger> = emptyList()
    private var currentViewType: ViewType = ViewType.FUEL
    
    private enum class ViewType {
        FUEL, ELECTRIC
    }
    
    companion object {
        private const val LOCATION_PERMISSION_REQUEST_CODE = 1001
        private const val DEFAULT_ZOOM = 13f
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize location client
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        // Initialize views
        toggleGroup = findViewById(R.id.toggleGroup)
        refreshButton = findViewById(R.id.refreshButton)
        loadingView = findViewById(R.id.loadingView)
        
        // Set up map
        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)
        
        // Set up toggle group
        toggleGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                currentViewType = when (checkedId) {
                    R.id.btnFuel -> ViewType.FUEL
                    R.id.btnElectric -> ViewType.ELECTRIC
                    else -> ViewType.FUEL
                }
                updateMarkers()
            }
        }
        
        // Set up refresh button
        refreshButton.setOnClickListener {
            // Re-fetch data using current location
            currentLocation?.let { loc ->
                viewModel.fetchNearbyStations(loc.latitude, loc.longitude)
            } ?: run {
                // If no location, try to get it again
                enableMyLocation()
            }
        }
        
        // Observe ViewModel state
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    when (state) {
                        is UiState.Loading -> showLoading(true)
                        is UiState.Success -> {
                            showLoading(false)
                            currentFuelStations = state.fuelStations
                            currentChargers = state.chargers
                            updateMarkers()
                        }
                        is UiState.Error -> {
                            showLoading(false)
                            Toast.makeText(this@MainActivity, state.message, Toast.LENGTH_LONG).show()
                        }
                        is UiState.Idle -> {
                            showLoading(false)
                        }
                    }
                }
            }
        }
    }

    override fun onMapReady(googleMap: GoogleMap) {
        map = googleMap
        
        // Configure map
        map.uiSettings.apply {
            isZoomControlsEnabled = true
            isMyLocationButtonEnabled = true
            isCompassEnabled = true
        }
        
        // Request location permission
        if (checkLocationPermission()) {
            enableMyLocation()
        } else {
            requestLocationPermission()
        }
    }
    
    private fun checkLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun requestLocationPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            LOCATION_PERMISSION_REQUEST_CODE
        )
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                enableMyLocation()
            } else {
                Toast.makeText(
                    this,
                    "Permiso de ubicación necesario para mostrar gasolineras cercanas",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
    
    private fun enableMyLocation() {
        if (!checkLocationPermission()) return
        
        try {
            map.isMyLocationEnabled = true
            getCurrentLocationAndFetch()
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }
    
    private fun getCurrentLocationAndFetch() {
        if (!checkLocationPermission()) return
        
        lifecycleScope.launch {
            try {
                // We don't need to show loading here, ViewModel handles it when fetch starts
                // But obtaining location might take a moment
                
                val location = fusedLocationClient.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    null
                ).await()
                
                if (location != null) {
                    currentLocation = location
                    val latLng = LatLng(location.latitude, location.longitude)
                    map.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, DEFAULT_ZOOM))
                    
                    // Fetch data via ViewModel
                    viewModel.fetchNearbyStations(location.latitude, location.longitude)
                } else {
                    Toast.makeText(
                        this@MainActivity,
                        "No se pudo obtener la ubicación",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(
                    this@MainActivity,
                    "Error al obtener ubicación: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
    
    private fun updateMarkers() {
        map.clear()
        
        when (currentViewType) {
            ViewType.FUEL -> addFuelMarkers()
            ViewType.ELECTRIC -> addChargerMarkers()
        }
    }
    
    private fun addFuelMarkers() {
        currentFuelStations.forEach { station ->
            val position = LatLng(station.lat, station.lon)
            val marker = MarkerOptions()
                .position(position)
                .title(station.getDisplayName())
                .snippet("${station.getDisplayPrice()}€ - ${station.address ?: ""}")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_ORANGE))
            
            map.addMarker(marker)
        }
    }
    
    private fun addChargerMarkers() {
        currentChargers.forEach { charger ->
            val position = LatLng(charger.latitude, charger.longitude)
            val marker = MarkerOptions()
                .position(position)
                .title(charger.getDisplayName())
                .snippet(charger.getDisplayPower())
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN))
            
            map.addMarker(marker)
        }
    }
    
    private fun showLoading(show: Boolean) {
        loadingView.visibility = if (show) View.VISIBLE else View.GONE
        refreshButton.isEnabled = !show
    }
}
