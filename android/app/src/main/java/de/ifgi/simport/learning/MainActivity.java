package de.ifgi.simport.learning;

import android.os.Bundle;
import com.bkon.capacitor.fileselector.FileSelector;
import com.equimaps.capacitor_background_geolocation.BackgroundGeolocation;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.community.database.sqlite.CapacitorSQLite;
import com.getcapacitor.plugin.Filesystem;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(
        savedInstanceState,
        new ArrayList<Class<? extends Plugin>>() {
          {
            // Additional plugins you've installed go here
            // Ex: add(TotallyAwesomePlugin.class);
            add(CapacitorSQLite.class);
            add(FileSelector.class);
            add(Filesystem.class);
            add(BackgroundGeolocation.class);
          }
        }
      );
  }
}
