using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using PolylinerNet;

namespace RunTheGlobe
{
  static class GeoDecoder
  {
    // TODO (app) Not exactly sure how predifining x and y will work for arbitrary tiles
    public static List<Point> GetPoints(string polyline, int tileX, int tileY, int z, int tileDim)
    {
      var results = new List<Point>();
      foreach (var geo in new Polyliner().Decode(polyline))
      {
        // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#C.23
        var exactX = (geo.Longitude + 180.0) / 360.0 * (1 << z);
        var lat = Math.PI / 180 * geo.Latitude;
        var exactY = (1 - Math.Log(Math.Tan(lat) + 1 / Math.Cos(lat)) / Math.PI) / 2 * (1 << z);

        results.Add(new Point(Scale(exactX, tileX), Scale(exactY, tileY)));
      }

      return results;

      int Scale(double exact, int tile) {
        return (int)Math.Round((exact - tile) * tileDim);
      }
    }
  }
}
