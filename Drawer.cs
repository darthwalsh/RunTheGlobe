using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;

namespace RunTheGlobe
{
  static class Drawer
  {
    public static Bitmap CombineTiles(int x, int y, int maxX, int maxY, int z)
    {
      var dx = maxX - x;
      var dy = maxY - y;
      var combined = new Bitmap(512 * dx, 512 * dy);
      using var gfx = Graphics.FromImage(combined);
      for (var yy = 0; yy < dy; ++yy) {
        for (var xx = 0; xx < dx; ++xx) {
          var b = FileDatabase.GetHeatmap(xx + x, yy + y, z);
          if (b != null) gfx.DrawImage(b, xx * 512, yy * 512);
        }
      }
      return combined;
    }

    public static void DrawPath(Bitmap img, List<Point> points) {
      using var gfx = Graphics.FromImage(img);

      var pen = new Pen(Color.Green, 10);
      GraphicsPath path = new GraphicsPath();
      path.AddLines(points.ToArray());
      gfx.DrawPath(pen, path);
    }
  }
}
