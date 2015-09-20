using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using DMSLib;

namespace RenderNets
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void ButtonNet_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.ShowDialog();
            TextBoxNet.Text = ofd.FileName;
        }

        private void ButtonSource_Click(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.ShowDialog();
            TextBoxSource.Text = ofd.FileName;
        }

        private void ButtonGo_Click(object sender, EventArgs e)
        {
            SaveFileDialog sfd = new SaveFileDialog();
            DialogResult dr = sfd.ShowDialog();
            if (dr == DialogResult.OK)
            {                
                DMSImage source;
                if (TextBoxSource.Text == String.Empty)
                    source = new DMSImage(new TestPattern(new Size(6000, 3000), Color.FromArgb(114, 115, 181), Color.FromArgb(229, 229, 229), TestPatternType.EquirectCheckerBoardPlane, 30, 5));
                else if (TextBoxSource.Text == "quasi")
                    source = null;
                else
                    source = new DMSImage(TextBoxSource.Text);
                
                Net net = checkTriangular.Checked ? new TriangularNet(TextBoxNet.Text) : new Net(TextBoxNet.Text);
                DMSImage dest;

                if (RadioStereographic.Checked)
                    dest = new DMSImage(new NetMap(new Size(3000, 1500), source, Color.Gray, net, NetMap.XfrmMode.Stereographic));
                else if (radioLagrange.Checked)
                    dest = new DMSImage(new NetMap(new Size(3600, 3600), source, Color.Gray, net, NetMap.XfrmMode.Lagrange));
                else if (TextBoxSource.Text == "quasi")
                    dest = new DMSImage(new NetMap(new Size(1500, 1500), source, Color.White, net, NetMap.XfrmMode.Quasiconformal));
                else //default
                    dest = new DMSImage(new NetMap(new Size(3000, 3000), source, Color.White, net));

                dest.Save(sfd.FileName);
            }
        }



    }
}
