import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

type GuideLottieProps = {
  size?: number;
  variant?: 'forward' | 'encourage';
};

const guideForwardAnimation = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 90,
  w: 220,
  h: 220,
  nm: 'LociLand Guide Forward',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Guide Body',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [110, 132, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 45, s: [104, 96, 100] },
            { t: 90, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'el',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [74, 88] },
            },
            {
              ty: 'fl',
              c: { a: 0, k: [0.42, 0.33, 0.86, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 24] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Guide Head',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 45, s: [5] },
            { t: 90, s: [0] },
          ],
        },
        p: { a: 0, k: [110, 72, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'el',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [76, 76] },
            },
            {
              ty: 'fl',
              c: { a: 0, k: [1, 0.84, 0.55, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Guide Arm',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-8] },
            { t: 45, s: [14] },
            { t: 90, s: [-8] },
          ],
        },
        p: { a: 0, k: [147, 118, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'rc',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [62, 18] },
              r: { a: 0, k: 9 },
            },
            {
              ty: 'fl',
              c: { a: 0, k: [1, 0.84, 0.55, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [26, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Forward Arrow',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [45] },
            { t: 45, s: [100] },
            { t: 90, s: [45] },
          ],
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [174, 112, 0] },
            { t: 45, s: [188, 112, 0] },
            { t: 90, s: [174, 112, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'sh',
              ks: {
                a: 0,
                k: {
                  i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  v: [
                    [-12, -18],
                    [18, 0],
                    [-12, 18],
                  ],
                  c: true,
                },
              },
            },
            {
              ty: 'fl',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};

const guideEncourageAnimation = {
  ...guideForwardAnimation,
  nm: 'LociLand Guide Encourage',
};

export const GuideLottie = ({
  size = 180,
  variant = 'forward',
}: GuideLottieProps) => {
  const animation =
    variant === 'encourage' ? guideEncourageAnimation : guideForwardAnimation;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={animation as any}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});