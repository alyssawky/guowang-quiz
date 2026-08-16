(function () {
    const STATE_GRID_LOGO = "data:image/webp;base64,UklGRuIyAABXRUJQVlA4INYyAABQtQCdASoIArUAPmEqkkYkIqGhJ9SsIIAMCWJu4WsAxZ4f8L+jdunH/oj9p/iP3Q9pDkHve97/cP2d7R+wjtXys+b/+3/gfah/qP+Z/mfeJ/VP9X/2fcM/V/9kfXX/Zn3ueY/9nP3H91//n/ur7zf7V/rfYb/qf/X61n0RPLo/dn4ev7B/2f3f9pn//9n/0d/Yb+z/kj4Nf2/8jvQn8U+k/uP5O/3nnpdZf830S/j32V/L/3P9vv8b7Zf6Twl+Of+H6gX5B/I/8L/cv3D/uvqq7XW2voEezH0b/Tf4L95f976XH+n6E/Y//R/cp9gH9F/pX+o8sbwyvS/2A+AP+df4L9hfdo/pP/l/p/Ql+df6H/1/6D8nvsN/m39k/5/+I7cnpUfuietTXal6u/kO/BBjEh34IMYkO/BBjEh0zQdEIgMVhEkqpyK/qj9E3YGYimTHliEZkreBN78p3N5Peo23e/7qd71YYuqgGF2/g3aTihku5oRc1A3ajFdMc7Ug7TuQACKixQ4XyJDIbPN/94d4TYQX1SXWAFdC6Zaf2sbiWcVH/z7AM75dz6IhbiqPAA/J5RmFZqiS04NblTDk5rL2mt/zrYfUhzmFV1V4difiB+BEscKd+dmd4iX9p/Re4TtsQ8ErJVLle7xVxBwrA7iH7gdm92LZmRbZxDq7/Z8PpCK8hU7ljVCJqa/LnLSKIJhW9PiqG6xlxKdzTwdGmuTqP1O2jFXCn9G/1IicTO6/ojHH8lg7Xo4n6JB9O6GKl0/NyfMKsKPbhxgvfQ54z7JvrByxy1ediJd2SsoukUB7qncaKmGw/tB7WuxrB+XHVXF72b98QrBVQ/JMQDNY1UjEj/U2KW7yFOCg9P0xN5uIjOMhiDEWFRUQ9hld9xnbHZw0yDrHgIc4U0ifXUHaF4z4Pf9+HN8Z9h+jj7DP0S4Qb6qQMZPBn6bRaavUMCoaW8sSjrKu8u9Ul4Y1wRbTfkIVoTx9WWVIXuBZWt7P21nUESDxclej/KT1rTLm4RFmEZ0XN3pOpIKQj7YL0qg8gfMY3O1sikn9tUb2DN8p7HOaLtBC+SZ8+yVcctAqSA/zX0mNPyQakZ5LfHqgsYjt50RmQea8B8gzG7ZFlOqEFlilYyaYr+eonzdipID3zLR67whmS1yjYjk9zU82Y6cJBG4do3UrIJRgtPib8Zlh1Axu3eVxSI5JkMSiM/gr589UfhaRyUhaIrkdDp6HDP1yCI7qfR/jwwL/UguZKJ6UtLPQpxsgJ20dPzCpHAQuS8XlT6Dg9boKNMhl0cyHKhAlUuwHVoARK2wOggkvfHXqEZQphE+TtWgXjCZOrH4kw69K3T2iMcYczcuP/xv7vu/3i5t5RHu9hpKr6Dw6PU5Pid9S5asMwTpHm9a6/l52nPW48wgHFSC9Jkc7+c1TpIfwhb/TyICNHfX/azick9rezQH2I/mO489F4jnsIfvzn/2tRen+/QNYWQ2aWLCRjsND30DFrU+moJoADddAW0QsjNnqOsac6Q57vl9PnHrlnN/waZ+JceK2JhYyxHmM09Dq/5qqYR9MuEKcCR3Vqpl87++Ca1xl0cOoUkaYf1aKNuHl8Usoxyqktixlqqzdvd+0ACNXSY7l3agxJVtFNxoESKbd4WfVeBhgiSweTqKnVHa6Jwlm+HheCxjmEy4qdBSToJVDBfNPsB5XeXA6HNzlk2Zn+UvIGI31dZKtSGQWI30uYmWzZIJ4fZKXEVwfO9yM9QSofvDqr50fcY1QUrzaDmG0duBK2kabs4dHoy1yWf8+3pkT/ifsgWEnT/t5eFzeQ7oxTmLuIQyhrY85vEFC563Ud6bH/2dc82+XKwnfrcP92YZ1ADuKctPMespAEQxN13zhcu1G8A6PqyuLBUGJd/EkLH4/Chs/kU2H/5RjfWVIXGkpsJZVuaX8h34IMYkO/BBjEhzQAP7+4kAiAAAAAABnNWJV4d7inq1lixErnopeq6qUX55I3XRL/gk3tPODLY9R7FHkJnSjJWA9W2gPgLWxCuqtz7MMnD4O6IaPD3p8XXJ0PNXDU/+HNGsu182qJMA6Uyw0kAV74yva+RQ4iby0NKZIZwRlZHUxGEWT4yR/WJFOwlYJCdA1EkwvesjuwSIs/YDqRYdRpiCuF1vYu4g/+TR6pfVEmelmLaMWSdOtVkMlCVvLbsjrIZnwadBAD2wtwR1zWpHnJMYcbHSp9BwnxRA4q2hv5HLqH/E84DljygWb30Ftzu/V3U0UWCxKAm5GFt/E3GY83CXzDy3CwpvOEl0KmVWW2EAsrrTFDNtCCbYS1FOKHPVyuxUEF5ZYzc3Aa0OKATroUqXEORQuATXYpdA85RGb2MfICgD1Tf7hw8W1LGB5GWjYZGamuv0wvp6+3nchLSyOV5/gYZy6lr7jueUtacBignIgFmtjwx0gausO4dDZBnyve8nZ7JpPqdIRyYpUILElira0kvabiluLuN9RRvBbFrUsu2ItQvFfPKqZl8F+BBcXzqhtLeIj1JthMTzQy8/dUDO2ugaArnRiP9xbWd90X8wAs0VH4OQg4+h+7xy6ZgEslEwTVxzyux4IyMhsgCxBWIs5sBYf/hpaMnOJ98b0/HTi/jBY6F6oRO5JPUTfnDYm0Ny7TREzA6AleUsovwar3aaCsbG5Uz+f2MwaJ2z79EPYs5fiH/edsMns+ukevZWveFKMjlY4uCB/r2VrqcqB2NEk+CqGXb8mRZwGxjOg/j0QPPjR+p+HA4Ck9DzuElogi3ExVkt6KtjLXPEtcvnsjr/GELt6DPw5Mui8oX48NZydEZ3A3iIYxsA4Wo8MLmq9OZxYXtWi8Np2QHgfkONJMppdzI8cPzyILvtIkBSp/Sxu92ZXnijJZ7A6XjJw4UUow/ACpnqbcVi9WJS5mOnrcD88wwnWWJtpMqmsfhuGwnQD7OXXL0QSQzzrVeppBJyqUmppI66BSnc5cbyLosgdmCQhuq5xldnwcJGdha0fhOGU7prsaMi0gXM8cXZ6pR0TFYc1ebWM7HBqUTxF7EfVIcJph/07BYJ3d3MADTE80ptY4qSyyF3lbmG9MyAI2n2UpAH1pVxCeqoJCpFUqcC/oIIgl+6acIRrw+vSe0uKkiNfO9fX6uj2nmIx2vW8ZKiyz7zDV3jt9UI1P6S6ABeu+RJz68bgoYk6CVdYfhqbxNg3didQJ5nPsfyHq3jCQUWM49t0btyrk3M2ct+jUO3u/n6GcUv3nwQZRZswh+eaRHGLwCcBxq5Z5CBMgvtDkmo3SmyS5c9j+xY0NT2r01vUPfmXMrPnGfyM8edPTx62F+0P/RtvpGLaw6wlVj2RFwzdzv/37c3QmljeNz5ZKJBiAUlJ5S6Ygh7DTlK0ws7gsoP+CEUQ5pfHFM3ohObtiC4lfA4POGo2mY9ooyRaka/LVJQX0WTnrXUbxPtlxYo+S1JxO3VIfP+WSf63x/wobELG4tKdFkTDiRfgrla3PCrLi5VQETRlow5nyxzqWp0jlQm11xOCqrhWfTBru6yJeCY+n/iXLpbPtR41pdN6dYc+XR7Glc2MHjAj0tGKPSYUQ8smraSjK9VV5TpOdCAHiR3X/9+RyFRS7DYuQ0vW+JgEyEeDVWtAOkCMjJIWb+D4iZh4ulWBrg2PCvHvN22+56q5jGiOngp+shazV+DaWMVdVoXJpW9tCIr6KF2Wa58RN5VvbRekpBnG/eU7u+m2YmxeEMdQbQq1yG/cVoE8DWFQCTdTv2VHG6cbtuaP3aI7YbQYkwUMw6igrvNVEavj9+SEzTKFIb+LN42MrNmtB1zgCqXu50J2+6Jr9A0fBstp8Vc+1AmqrF5jDTb/M5fLS4yXkfoiR+wzm2ukuciVI7Ld0+itZkv5WkO4Js4jme7Do1M/i2DsTzGnkmDqUByJMc8Q/zf1nmbteFQOfUiFi/ORCnJKCiCi6WFj1Sf4vS23oM+yMibSR97huB70Z8k0uyTTSeH/PKzjBJ5kXtl9CEFoW3KFzid1lzu0+0K26MudWfkF81Df+Qnl7xvfwMQdzO9j9Ap8NnW8fZQjCTHYQ8nOAqdNOHER/dLSkBNGm3h5VA0a1QuZXzEtqva3PcMTbrYCWZEb85gHtKfBz+HqOaGyCrt4s1dJOn3UX/GWDfd2h5EFRj4/+2r2rSQRO/bubg8srYkm48xIUbwp5/5rL4C0z+ZsKdsXv3asnU/JomQKzTvmD3yk/Q8XhDOjxw4CyOOs+v7M95ow9CCLJeMXjABRh2u54sncmjuUr4R0NntnoLOu1cfRDXgqnW0Fu3jQg8HF1CBRAF1dQQ8gBUhredZ+lOwkw7t5yWHcIHuVsXVPdCEwDXFtra4Q6TIDxTwYC4e4xf/olj+6/LKIlnX8Bw7Pm58QeWEgGGVk7WOxX9VOWETKqbtJKxCeHwCwVOaI1F71k+MfmoEhSYwpiPKOvA28Zh9cKhqQL/cTTrgJt3ED7DJ6VnCdoGd+uhVfe0rPlieeEGBJ+BW1dbRE+LaMU449AhJzgLEc1+RjwDDj+UV7kQolKmiUtVSzMed5PB9uvZBdlP2fFIIPw1RiObeg5++QBZhZemb5vAA2OSQVOxH7H7xGlzDLrpffeKZu1aMgP/ge09RYiKwUkuRjEu06XTlovwDMPs5li+bzNyToLNvfwgytq6DMcWY0/WA4Y0mZnSyiw9jZycjs/J4nGP75gJKv1qkbAiU3QlMovhmZxGcMgkLBMa7hULuegS65fSjr5NhxbXMgtPMh6VOLHTqPKqP2G3AYCeso5dvoVEofkJjloI04lR9maZoWmhIXTthtTlTeVJSgI6ii6ffa5ps02k/JuPbKviynoqgrrTPrR7nuDpP+7rh8YCo2dE0dHHkUuJ0dRP1ooBTzzoF3pcM/LpYqal4ldvByIifjfiqbloniPVXhNwjWMh55LmefIXk4Cl0BC7OIWsOa96LyoAy37EKLXD3xK4YMxg3Y67A/lR8l4NDcslYWy0HYsRYbiiqBygUJB8uSa6WoiSDvkxXUum37rGr2h5XMsX3bu1OvboD7QVx94M7OsOY+GPKfwZNG4ixQ4ymD38em+ympi/LzyWM3SQzDax8Z6dT6MwjiDr1BNBtHAin23+wMXwQ1GEGW3XSNb9zpdw51V+tQI2X76Hw0/L4j3R8jJNLRt0hYZOMnLjtSEWryfE4Ox5eQPAGv80+myXlN/1PNVkgZAdqf84QM9WF+EHz5ho/t+1iawgcZcMUiXK2UWxZZcePYQZWO7ZEu2er5ddqRdkl5kaI3idSPgFA2ndkGCRoDMAFBpaMSHCRRznUUXij2VD0fZZcDfcyqVOWF0NzPocOVhx7nSSesjgwdNcAbd9WkYPAvw/yD37YiF76Fi0paKl9Ntu5NVyJWFFN0lJcPRbTrPBwySRRd5hTlJt6a8u08mbmUEtZ3gECnok6CY4WwU4VZRpM1s+7N2PVazYs6DGLVK+dgnrnt/iuUb0mTRqZU5emJd0OkEEHs+HvgtiQljto7TtiV8JYqKxKvZdz10X/s9X2paFp/lwgf8/ZL9TU3kOyjr+KXooYYZ9c4QxsvwyfQ6ta+JMuucPZVzCTXOvFYyQIgI+4RCE15wy6u3jS5RqSB9MT3m6AsN5yiljSWBHFGFmuheAd4ND+Zj0SaRMGWhBnB7AKA9Z3NMOPcKGN6kdBCTrWPB6pr6wpCGq66YaKfBm2vTQdo+tJCAqNVoZfyUF5fxNWwwh+lhOz5sC+9c3tAfObyC4O6YvzA7Uwo8/43SRL2sYDMRQGzQ3RgsfIErJNOenXzp3i9b76ua4MUxzTiymBwwWOgq8pNvp7HwOQsieaX60G055VGGOJMnQvOlWPfHh0larC6ab8wXG/Fj3SGuHcOdKUK9i+rutqfPyIyF2FrPg+Vi2GH7eaCWuIOvX/a/3bZNlgtElsm+l95rcnfoojEFvwegRZHXyXNJUiFANNUgaVoToGLnJcg47Vov6jYgBpsGEV7axgJFkOZNlw+tco2LdYNohLmMQxGNecc0IOuJFlDbDyMhOJXyZxRVy3OJYnGTXEJHCCLHSyXArQp2m75YzfgXUbCvCjrkLJWwz4WXUbqmlsgh2EWf7/mTrYUQexRsjaPrCxrZVMGZwcMk1dSGCcfY0hjOv42f9E8LBQxV2+mzc0gFMwCBp/BZBA3WXzp87RU8r1XF9rBr537R5KEoSWMKW7CVm+bLEtn+8PK1ktjRQmL9zcUE9F013WoIwlNYqMBpckusuUZT7+eWO9boIxOHybjwoFLR16mhXEvYmOkEkzNjRApGxfox9gNP2ObEjsWp/j6Sn8IM+keBDj58Os+M2Q0Ewm2ed65BnvTKnovm0libRUCPoMiEWnozRGgHDMzwgd8daefj9WsqdMQUGmxIHXjSaRcIq/17xSYJIHD9jj7U4Tcw7GEpt7zPjO9DXJL6j9pJJQkUNifdkzi/WOJl836/qZsDVjJe5Ii5j1oqAMoSnLocU+cmtfAmG8Zg7Lg7dKq8a7DPfnFo3dA9oFNaklzh5NkSXNr9PHDf8EqKbSCYZ7c1E7jXt8wFPABNFca4uyfgJIUCqzLx29gT9vy7O1V+mUat262Wm9h2EUvDebNnegKfL57UQDZWs9KrkZtPwKxC8Nq0nzMr3DPurIqe9nxy3cv/qCeUwOXzDz1NoctBgiSTTTmPRQRaufIyTpUkQ4jsKR2oE1uH/FPAAXiik0/hIhlySlwKwNACyPBVf3lRVcXWmt1U52c2X4kTsdEhJFaC5Vv8n9GT0pSObIZkzLyJiqqqGsCnR+aZZpQHBF5qcsJ+iDOWhPGVjm2oP2acjN7/VWNL4NjKCuT7nAxFS10xvz3jGWxd0DqbuBg3mMP1oALZjpcSFsXzrLAz5YyV8V8EwCgZcsF1Lddt6OWLK4lCkz/0NQCqGQ9smGak+eAckMiYAZDmL6edaf3o2ovShUzC0ZGsGSAis4OO8s7Bu9Ze3cArIciGA/4kP1CckUZVMO96A4y3VWDIOlhUXee+0n+GLdy19oZl94HfTltcLsncTBQaGMgmfxY2AW+IWLMuHp5spHLvrKPbtXuPDHsLFzjEWVmgvproOyAGuLB4JTK11fq3K8wrOya+5shgIlXJL8u5n4wJS/Mg6PQV86+A5FdDTKSbK+xK8OP6xEwhsDylxSkg9b5vOxWbqd2vlrpNkHOq2M0yZIbzBWQJyL2Zlz39zRhqrWbALdnq/0i1rRC152EIbyhDKLmioyAS5UdGYgxGiIN/KHC6HfA8rPVrsO8dj1AG5qLd+JdC334c0X3hh0h9w7y0RyKldJhW+SliSDfnoMZklxQdgAzvQs0Q9Pubzi5uCiTh9nsR6KKgzoAM9xyUorolfOUPWluX32fLtSe92qOsNYNh7ZaQu7A23DC5a4ZCfOmRitVvIpLHuDPgakZ03idQSYbhk+XIQgDEjHsQ0lHUpTnfJxigyGBMwRTGqmuUQQLTYnevq3gjzT62c0FxW10RgBT0oduaehKld8ZCQfNhUBpAIMNX8GXTt+mKbSicTH4fgV4ajQKqy1FC2SuIbbcMMWMQMY7ia3D7vFNabMuO95m0pyaGwOGm/QRCQSpP5aGjPJ7VbDaUMMIzjKiKSBYxkb29k+6rK0SFGWu2R+w/5kVwEIiAsteWcb+RzAoMU2o3LnllYHkFmAIef7NXH5L171b3NgjAogvYupqGz33YJzoTzF4pxaZfMnPuL7DoMNm6Zd2RnfIPkKYFTph7TUtgmLtVxmXh1jGU5Z/dkyjDh7gUJ2+Brm6kz+pZKiDhKlwQUFE7VwIoNRTAZ/IcX9lhU2+vPXcopP3Wcphw/3rQI2YKPMEQuWmpHsmeose4eoDzaQmQO3BzBkJofCu+7CJdg0A5biAooCwSrbmUcQuHaUKol4PQVl0AmreZ5e/eY7SVQ7PZudM4cJcu8roln3YoUZI+mW/VtN8Su0SjI40E7pOippPXGrqKsSemb464thSu1qHkIklTlBJUnkUIg16XxkL53tvlVvW0sB4d/ETRE/r/GNMzLuWIeJA5hING/Pk3yihMjrr4dpBdRDtuFz01pJYfTc6uDid1NrryUuuNtGC7/XKBAIq/kdA+fa/Mr5EVY3ki0xkM6oNUi++0Jo3+DptEi/NsosHrLGnAvvjY8kCX4aAWKk+aonqcSISszeOhPMqB26nZMATklZhIlpQ+J44f7rBfrrPgsbRL6rWwMUHjXaGLGvRAb46kn1KN7+TXo5yzlzdGTZk35SWTirpgrTevhuNdTYJhImZg/9nzxzqJKtAsZ6+M8ZO4pyYfsUIoFhOIa5XgdinXLz8mP/8nT+pjUrAv6Gcp8/GdlXRmp4qbXF7UojXIYaEMqzlGRYJjqcxPC7LoL4ofbcehLQ7foeotFBJcvNmm6lKwew2z/V14avDvp7gflkHUt4nldoZEXMW+MEwhSKQUZIr49/dzDpgmEMrRK2eRLOVOomKwGz7pbbwIjK0VU/uB1Mo0Lxcn6UD3o2m+JNLFBQocqbn3E0PyVake2LwOf5P+hgsHowPhWtYJxMbX8W2I8Z/x8Ev83h90VY7Ai4LDtpfK+jRnVlS9SbI2eBpUf1Gb5zwskXmtwdXGGZN7OjWOXAqtUqhJzftwvZYudiayna64zKPD6Lp+xHQR1InOS5HiBYUaiNoJHRl0203KmDqRJg/xXjdaTuaToa6KDnwiRX4waykr3VAJo1c/IBeAcoT6glWA3P3t81DJnFrY+U9MwacLn42Yo0ktSh/sy3mzjlSpLVLjZIOi74tKNbbDozLcoy5aE9tpLdtZSveywYy1ylNWSxXo5ShBzZjPgwXOK6pp17OjnAuPJLVVcjwZcNPYp491OaFaI1JzrFQoiEK+a+tBveYUrE8yLqW6jXq9jKPne8ssvgzVe2X2v9cHPB0wPrM095I8JtYHM3mhhVaIoWmxbXWa6PsBhiKpBzBHhMeDWiFLV4osSksDXgjT+3qs2pQwedXqDYY8ibqkLiDENowg3LvAgqfBrWtH12Y61q0TB4UtZlkRquAk8qgJubavUuP7MTKAOCFaNtDxbsFSExzUbs8ndFZSdFcduayhm+3eTD0P+n/0OUz03dPKYO92al36I79OMtfdWePaWr4xisSm/XTJanHeKKF3+PeYbeYAuya25WAL8mY0HwPq8GPAqjdfh+2Z/yW/nPkQnAuDLqX5fzwscgb7W5K8BcCsjSqSTS9CeaYT6BZ/KPhvymG/f5evz42GYUH2fu94VwTg0x6+7fpWWri950Li+FlrSIkeHhN6kAJfWdU1n0Gcp4nkWLuwLKYUrLR8Mdh78WiU4tTCH8nzCQ2ca+sYb0P4KpKnq/JTlIA/HshEWnnLNVNZRG5aswfl5PyHM9plqu7l0d4P1j2fpYj68/WbcJo1+Ivz7bq0cDe4d4OF3zYPP33I5B6zkBwww3QlpmTUsEWikGyU4gkyqHU1ZRzD55sauKFAdmVWocfC00ZcYZiFmFYzsIR23F+UwcszzWmGpeOe1kvZBB4XI1Vln4L2fsbZuGTcWjwfCjjUTQcdoVeF7u5VuchDVURT1bfzOMeqNnAwr5A3KpQPOPx9hiFq43iL6H3+at+Xky1IN5r/Y7crVAYMvwbTTOEa9Cn9EDt+2afFuvbJF0HSTSu/dE8enEn3T3oJLg4LW+eaQOa42EE7YdreZ/xb/V4z6URytB3XUKPIo92C9W9WB+dD18W1gOamVbYqPH1QuStl6f4dD68pXyMtLNEMtTggValsMUy0wxtQ7PyWIxh/bR9UpD97CeZreRlkol6HYl5wrxb97gflpP1oVl2jhiHxTSVsV4SvJ1AqYjg6LWqskUPrPNAcIpXHhVq2gKxhfdNsPlbRPtu+fJDws7VFKpiVohCh1fmcGhpu51gtgCohptrXnFvh61Xpq9VuvzKc0PVta8VyjLijKFuxBiYE6TxN8pbyU6HnUH0+Rb1AQ/y7gfjIu8x2DLiEHuK/SpdfcWNCwc+EmoIAXsUWp5XgVQZYqKK7wlQZdHOb/DgIb1U4owVm9lxGDj4nh44xvU8psaooUK19UVhX1M9nLNde/qKdyQGxZehMe1V16yxUCLECSv3ua0ZfvEFmkuosnfHbwyP/t50NeUCAfV9kBJ9HVE8NZ9o79n65+PcyFeR79Dert4nWEVJcIDoEuoDg4iZBJ6odPlOmaa9UeLPCR9kK3yUp+jZPnap9d/8RYnADqecvf6taF89VWb6AF1d5YfBR95El2KgU37XPwmqI7VZMAW77OwmOuWZQEecrcnpdfGKmNx0xc20hWrqOLu3OhWwS0SSW97rOudZD9TK+MFyNoOT7lyQNJpzugj551pBOytw98hXcmUKvxo08+5L1IoaeviQ08BYUnX/lziBEQCuyHTG/4wom45RrsezKDxxmy99OynCA+ATVe0jRbef3zfAKkDsrkCTXXRX+2IcMVCidbqnlZheFIhxuIsIi2acgVIUs2k5QlIjvXHPBMhdmE85h723KKo4FoLTHadrJIp8yRD/Nxykcf3NgYTM1E27G6l5ycAXg1xq7jkK4uJmdYZKwHg4LaJlT/E5eU7Ge4wuylmi6nPRrGI+jZwdgU+GPwFFAOLqGcA7o36mVkzA/hUxFiPjvsxbDtapwqyQIAuktCyGYjrRoUx85fIeUFOaaD/FDIPZGs114H0xqVAlM4puEyGHQ0GoTSQSkUAGfE0eGbeSLotJPO4rnHIA8I7xXA6B+/qhw6v2sOyefFDD2KgElvRBkkFt4/uWvYUhhBBmsGaGv604NI3egxtB6FnGff4P9+39xhazFsyPTPHd6BQzk8CA3QK78RXnmw+mioUpzoACXPMfk0J7SgXgWwq6XLf0qmZUXznfX9ZpY95ZJQbghJCimRuUB9KRnXZ0qawUQcjcZnOIBRPeze7SwOUPycuLagooFbqUfnABY5NFxc5frt3rZHL6VgeqX8GpaXddQsNy2jFpk926FPQVDCGx72iI/Zoxw5YB/KF4WnKnsxPVXMhk4/deHU8cqW2UDmjL2AZ5FEKvJDB4VYvLBqQjvrz00AVgQUeIeE2Cv8sknSCMkz25Yet1COO7siLIF5wvKEXW7J6s5Nd5h/ovjVfBoC9k2cuukPmVURG17MraJ6eSx29Rb86fUT/VGEbusHIu8Ys9ON4mhmqf0V0ZcFLdx+Xp5I+KjFeJtrJMdYocPbqFeKTqoWlBUM8gs9RZG8uyAe6S+hw7rNfNTV7nLt4h7Q3tbAldyobiC4JLc90ovONTUpQ6I9vYmrwka/zq2cwwCyQjjCj5pfcD8D1miJ+thzzCkMyE1HjxcpxjoLv7ns3yZ128QUL5C1QU1AOpG+0UjGJqjeiy/S87I0pELSFcZJ9FgVVYOhEAxiqY+dIK+aW6aO9ZhGfBRBzr5JCRsLHqTGE0/n8Alvt4CzP7kBIZv9DyH2HoQZdsYbvj75FUqBnLEOIiF/I88SDK4eQmT+GhGY2oZp5hn6/lNgiTWr57lhx6RAXaKKyRz/7FfP4MnvP/jLmavHcCOmZOFI5GhNm7bPS5msWwrzD0w4o0tkiRvgbVrvjHL05l2QIWsceqy8LC6Cp4sH5IWq7onm/0NMuAhagGCoQPSj+OhNaLPp0k538W9jn+Ztqp0hkfuHp5/5SSvcA2/SRT8FFDkKuW08w0tvKYrd/My18qTlNLEPQ/g5KOGSTrM7AonL/jRWl8jpkoumOO8Q/2YjiKItOzbbgHMLGNZiddJR5YZhg0jRjkt4P9D8KQVcHOTrrqFyQYtUrUYJMPGxzb8qeH8AnhBFv1uiQNDka+a+h+Ayhkv3p38mIVvYg3p5ID/JDW1dir5SBVoORA+d/KvWSve/RtK3Mwn1MwdkzgucGJmL/nq7CryAQ+6F90QcMMpEachQ77+jme92RwbTe/rGTFieSlCrGp4CWX05Pye4waDyQ3C3tqdS02cz6VXKh5xB3MX4V3HY8qoDJAZhiBK9IdLT68InrnrgWs/UbfwG5IStH9/ez6Z8Dzf3yg3GK2hA4zN6VS3u4gAADoDwayP84adtUuy0X2HkMJFMYPhNy0Hu28U97g8pmsoMvHBCeoiV6h7jujvWvfHXOcXllDmRSmh+cnZrM0he66erjQM435bCROm2djxEFT6f5X5NVHMuEDZCnTFMeN4P+kVIIQInN1MjC+YixSQc39yP5FpuAfO8lmUfapg86S9QOeXsRWw3C34aNDe6XA6Zsc2TXcAiJFKD3xvbSGwH2QmYlGz9WUGM3Sgz9uV5j65zuRwErQQOMyFi1KAO1afRiX0CZLNhb8G4tw/W0JRIrpjUayd1br0AYfjMMwaQtcPN0NMwvcDEfSreA0gx7bo9n7a5tA51zycd3tErF9rjU2gtWJia76fjhBAwsLHr6Dc/JBJ0hoa/U0Tn3mc05xOkvNA2EzGWBAVc94b/viIg1+b5JoMw2SlnM3pa6cHtEz+eAP8bvw6bNF4jneq9HS/BTXcS0o7MiCv0HcXvBthEUv5tsgEJcqCzZ24yhn8k6CXvc4Et5wFRhTMMxZ7tYkUD3560p7howL4uaCDnt0u/018tSuKq73kfaQN0ZiPgvqHZKC8aCp8Yp5/uwfeHTKUKo9KgMGxYaGehweRURjL/e4MKQP+GfPjlakv/KJKjkKY6GMEn4JjU2gBAvKsCH0YN295okcm7dJOX/ANDUUU6NsjU7r3+N1LxffBKzKDpGDB8nLy3+xTZV2Nmn2Y/t6yZZXpYmfzDHCBm6pvS4Xpt9oWaZ2PbkATuMWXEyfGGxWct3wRuracwxUuiAwKTeNIgVtpkAZX/wDrD5Q6dOU/gIyGCdus4qq6IaeJro5rqSxQTeuTHSAs1q2lw9xk98q8sPSktoYXGB/C8yfZDoxi5EfNmLSvqqZlmgefJPyyay7kSSnNIrceNk+IIx4fNzQnDstmJOn+rkIkB2+0nxEJVQrbuSAxga1Wh/TgVBQaH4dwLq1VC5gz097b5dQ5UTSqCVfMvGpiiQadYz+i9SPVc9EByzzbpOjT6aB775MLUcNmeUQabEkpPxJBLXRbonvo5rs3jcKzIkwOwpjjJ1tXrlFy+YmRJu6YOWu9HkS/gaOe3jaFiE44bi1k+1wEo1vcf8jGgF74ahrcff8+KbHwsqhsKzwjJ2rl++8JhuVROD14sCU6oX8zXE8E54pevcqLWM17agUSQThEYeO/MSbMIHZq6WA4km0WooKtE4S2mSwOorK/JZOVK2EiNhQN9Ghk8hKepXOoiAIf9Ao/N/FNz3EuUZ5HeLUb3kl3EjVD2FBNtijoGHn8DG6CCszbDXOz2cHCZc83EFzqJaKA+lS31PndkqcvHlfs1K+YWYFPDdDSW+07qkHS9FQ4fb4qusXUQsUHE/IvdsjvpYJSYKS6VO0urZw/Wfurl1pg7ixeRxErjEODC2eES3iG2xEFRayaB5rd0UyZNHcVbRLSsH5bSyF4rErhdMMnpY5auBr8X5HVDgim1S4Z13upzAwGx9WABrdVb9E3iLEkjnj4FBnFkoPJXoY7zFnx3B7SMexLnQZnXpjnvsAhBA73jfcgMpUR9fJswwvBOEuMiTlTgZwdKkySNjcHp5hr6n+hubSKsm+ChkwKPbLDpUgECjHh9Q0BLKm29gIWkOw5YWnW8mZWsf94VPcoQGteBBJ5fvumQVCZXFoy3cHU5EqbXHH053LEAb1SzOzqWrxzWiS7nAsKmppqC5EK5KWoFWf8U8ZwybR98lhMeKxReB6VWoqt9WYnMmZYky600pcgIhmCXiSpS75rfmpOssYxRuwEwjqviKdYU8+xlqogzyb2FKJMJtiFZ5SOehbNSBInVp+fCE7jwC2p9whcFl2tXV+4RO5enmyTl4Qxh1m1b2LB2dPaWh6lD1Eb4JST/x6YS0mhDwpKCORjvcBPLkJFzfJqfMFbVhFzfwqJN0ScLbiRhd+1KAbJ41Llv0nsEhHg2GQrP2ORYehN3/bzMCLV76BT5AXsFSyNjCF8Y9yd2ABE/vbaA2gsrNGx8XQRxdoIgxQK3HF2z/w/btPjDHmgpjLLAw09FLuK8X55a9usWZBaRr1WHoXfjcKw2IE0tm/XGn8DHCe/5o1AyLiX0EYLwM2wTiMVG3CxrlcJH/pbfHkg9Fehlby8MMALMjCCqnIpAl/Q2WCIPDUuzu4sqc1taIDz50+et7q25X9EiHdhH3WTxE58Hj5K0njWiIjJS0RbZeuJSyFsIJwV51xS0rg/QRQ8OY7B4uRttk0qENgtJuIIfwH7QFpMDEMf7PqP6JWFacZ+OM7mPtiETI9w2PPQ6iujGEEDj1EKjKf5KqstUl2Pr5skNmbHvWHFSce70W+ZT4pIcycZXyErdCzxRt5N/w6qpSPRxNgiNaM5n+x0ZqHzuLamvyTBs2PodKR3R8h18bvSeoKy+Kuaehj9A6c+LGRSOTRW09wjxpoRsIa+cuqR6SlOyI/gei+C8lhl5GMQFL5Kt6E/cooK6vi41BnVgPhdOyOew+gool1WsSMfInIeibrS8iL4U6h6AS+0hAdrLmUqOsc3lkuOct73HP1XzJG7w8EqSTprZ/Hmc5ml8hzTCxnmaO1NBJCF6BN4fMnLGao3yNUIXQq82a5kUXTUuktrQfA32ATEiHFnr2udCo9YAi8nOtjECSljRsFoOu/TWePC8Bu/1I/PytD4z+RHBZcFTwGBj6slYs58mZNR7dDFvjB0oqhA87etGjLZqsgSbDCjMp00MpxroE3OudP+AhmUMxSnOC58cqcho0V5hLxOkatLmZSVw/ige9GhwNDvBhsq52D0sys0BG4tAvPLrGFWER9CaSDzTsY9tRutqpcMVHINR4ufsPF8J+QfncnDeKXXEUmnojpPbKmgDqICZsl8QF8U/FM3wWwVxk83wYNbx7FLezhydJBfPrOqEOCDND2cpLyXo+c9RMLrmDcHSLUStczVJxErulk+7l3HFh1o/WWu4thaIP6MXIGkQijf9/B25jzyQRcwxoydsdOFyFx3MMtcokXhFHZbpCgOn9xaSFO7in+r55F2D8YSuf6/V5Lutuf9+8CqHPyeenRyFv18RHZsSxhFp4bwLSugCW5X8c7uS+MRDQ5q3GSWHUJ7jnrShXZ05r8O63Yg2Bib86Qd+0+1/DulT5gaCQKKdxardpxfr+ZOgSo6yfmcBTflrcKSNcGoFOf62CQY+m31yVErNm9a2brLKuXZV0JcHso1AF6c0Bc9INsCOgwPy2/rCvihxytmCHSlaRO/M+eXQIQREVTAKFmlz35NAn0StfKdEnjRfReDc56Cc68EILojlSdy6S3PoeadLZrDZndeSsZ8DXWoX0T4AP9wV5E6EyyR9dW+FXqjYlYVmkMYGC1CDKMHl95k/hWbUDIQ2Ycm2I/33FJLV1A6XKXQY0FWL+eqiDE9qDsdkTQW1CIZi+niBnE7CNUlGN1i/YoVM0AowQIB1LeM/wxZNOB7Cb5hRHCfz+dZfcdrazSE0gfzXPGjm9pT1EVvdD3JwWJIitco739t3dMKYXxgX7FCEelCoHXXthjYO1xmVxFOeh7S1+VAM+I8J4Ohzp+R5KPCUHamx5G9R9aWZ0KT9gjzBN/qi2y5ooFyRFNtu1DSqzycuXvZkckJUpqjmh/jS39TzNYjNadr5nBgg2Cou0B//fvPWv9ANAPMLrjCCNtqmiRW8MQMoyahTCtuoQE7zjEcmtKbj31vOLDYnqYQNKODbeJa118PJFwv7y0AKnFr0mqi2tvAFV7HrLJhvWgBfvB0YcHxkxrbLK1t5nKYnCmImCRryEa6jAMHB2rmqnBjZYr3tlzvFvsFHChzKUmmeDIWvq9iE4BP3N28AS+/VGoSFNDZ4MhgvJgFFwFvoF4dzBFxtp/+UMbwZhBTdwEKz6b/oSRHvBFQFHlBvl+TcUFDiiMg6tRUGPxxbI//pCv1Du29qtQ5GdwLsvVCuKj+OYkZg+ke7OVNr6hX1brbZl3ZvIJxc6sXfP3PQDmGaUde3Cm0vZno4wfDRvAm5VFrPc/1mR3fVL9CqlXJRvP51WoSeFsSoz8RRphrdHDayIn4RiRtEor7iVOylO7liGq2RjeZzgYC8mL+vwXvzm+PWhsoqWYkxVPDGEFJQQZqUBXJDz3Ugn8fqVRZnKsxrhCnvp4Lxh1SP+zjvBoZNCIZgkIj0mt9nN38PnZ29eRxwqU/ndBfaqazefrbj13Aup6W4OLdDeRa42gOp8VI5HYN0k7wIp6OI/EA//0yuaLupqATdhDyDoC+4AHw8wBzySe0HWPUpCLlQH0xmOEyJj8iQWaU1bODA/suUvX1Pla32Wo+kKBIfplazKRiPceLeBGdZPStGQOFabgq54m9UHuLZYXefwEOxmGv8EoqviLzZorrkJRml5mTG2sXLhsccerd4kfmQ/kmc1yK1JwBfvubJcXe6g0caV2LEA+cgI6qeYDL+yaurYNwqnDIimnadwoxlfPG3Hr5H8QbEbq7kt1T0FvA1DfRDPuYFZ76R/aZRDZLgjN/QZVK1IJc9BS14N8AnhdHjZJ5T9ryRPxsLWdWpYPqQglQz2TrNNwEGZj2LOJ63IqniT0mpSuRO6np0z8L46PLHy5d/0WJ3K1mmXVFyn7KcpsjU3N0XLkWxKrRmQ7DoGk5zeym2v86OpHn3DojKrjADSumt9TxN4jA6uov/NaHlZDZNRBpSC6zGIjyAPanua2iMsxZVxtaCNL2KgReAsnHj0sxwPzb1AeRZI1BVhh5zSiqX9SsJrpE9U8XBgVgapep9s7M8ryDwd4/v35mdpUX/TnsUiTsZaD8aXG/J+bmJ8rk7bb1Vbs3t9VElNd7/gllNCaPdsjZ55l4WTNGMARdCpU5IWWOK6T81UaZWrL5bBN6N1Sr0G3n00WFRJUDPJZNPurtqc/buYzgnt98q1llYQwfUWEtfKFNY+JVETsvxgSqV513IpJPlchhEg1KWvr2AI37Shq4PzqVqQ6k9gFawruZz8OKR1cr/fvXjKW0+9ztoOFY/0NOxAdCtdKvZW9yd43S+R8Z/Dcijn26xpwivkp4fUX8puxZ98qh9zdF/WAA5WgwQ2MbWefO9K8BDOFa0w0SeglnduzRD+Z+GFN+fvwWyt3fM4SBRvfRopAWK9/vy2kHdQTUj62+VLsx2d2wWMEVeFs8eU42qI4KPKhFdbT4jKT/VYu1kwYtHXyOpzgm385PqMg6wh7/aOmlwl1mrjcJQN1MVVLwucB8RqmAvzZbotO5lchuFhprAaz/hGBn/l+SwmyBFWUAchaoNmHAvOrMWWtFqA2Qpk1ZOAmMNC9cToIKKOMAAAJIAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    function getTask(question) {
        return studyPlan.find(item => item.id === question.taskId);
    }

    function ensureBranding() {
        const brandPanel = document.querySelector(".brand-panel");
        const summaryCard = brandPanel && brandPanel.querySelector(".summary-card");
        if (!brandPanel || !summaryCard) return;

        if (!brandPanel.querySelector(".sg-brand-row")) {
            const row = document.createElement("div");
            row.className = "sg-brand-row";
            row.innerHTML = `
                <div class="sg-brand-identity">
                    <img class="sg-brand-logo" src="${STATE_GRID_LOGO}" alt="国家电网 State Grid">
                    <div class="sg-brand-copy">
                        <strong>2027 招聘考试备考</strong>
                        <span>学习计划 · 分章复习 · 国网必刷 · 错题强化</span>
                    </div>
                </div>
            `;
            brandPanel.insertBefore(row, summaryCard);
        }

        if (!brandPanel.querySelector(".sg-search-wrap")) {
            const searchWrap = document.createElement("div");
            searchWrap.className = "sg-search-wrap";
            searchWrap.innerHTML = `
                <div class="sg-search-box">
                    <svg class="sg-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"></circle>
                        <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                    </svg>
                    <input id="sg-question-search" class="sg-search-input" type="search" autocomplete="off" placeholder="搜索题干、题号、年份、来源或专题…">
                    <span class="sg-search-hint">全题库</span>
                </div>
                <div id="sg-search-results" class="sg-search-results" hidden></div>
            `;
            brandPanel.insertBefore(searchWrap, summaryCard);
        }

        if (!summaryCard.querySelector(".sg-accuracy-stat")) {
            const accuracy = document.createElement("div");
            accuracy.className = "sg-accuracy-stat";
            accuracy.innerHTML = `
                <div id="sg-accuracy-ring" class="sg-accuracy-ring" style="--accuracy:0">
                    <span id="sg-accuracy-value" class="sg-accuracy-value">—</span>
                </div>
                <div class="sg-accuracy-copy">
                    <strong>总体正确率</strong>
                    <span id="sg-accuracy-detail">尚未作答</span>
                </div>
            `;
            summaryCard.appendChild(accuracy);
        }
    }

    function getAccuracyStats() {
        let attempts = 0;
        let correct = 0;

        Object.values(answerHistory || {}).forEach(record => {
            attempts += Number(record && record.attempts || 0);
            correct += Number(record && record.correct || 0);
        });

        return {
            attempts,
            correct,
            accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null
        };
    }

    function updateAccuracyGauge() {
        ensureBranding();
        const ring = document.getElementById("sg-accuracy-ring");
        const value = document.getElementById("sg-accuracy-value");
        const detail = document.getElementById("sg-accuracy-detail");
        if (!ring || !value || !detail) return;

        const stats = getAccuracyStats();
        const numericAccuracy = stats.accuracy == null ? 0 : stats.accuracy;
        ring.style.setProperty("--accuracy", numericAccuracy);
        value.textContent = stats.accuracy == null ? "—" : `${stats.accuracy}%`;
        detail.textContent = stats.attempts > 0
            ? `${stats.correct} / ${stats.attempts} 次作答正确`
            : "完成答题后自动统计";
    }

    function normalizeSearchText(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function getSearchText(question) {
        const task = getTask(question);
        const optionText = Object.entries(question.options || {})
            .map(([key, value]) => `${key} ${value}`)
            .join(" ");

        return normalizeSearchText([
            question.id,
            question.sourceId,
            question.question,
            question.topic,
            optionText,
            task && task.category,
            task && task.module,
            task && task.name,
            task && task.week
        ].filter(Boolean).join(" "));
    }

    function getSearchResults(query) {
        const keyword = normalizeSearchText(query);
        if (!keyword) return [];

        const parts = keyword.split(" ").filter(Boolean);
        return questions
            .filter(question => {
                const text = getSearchText(question);
                return parts.every(part => text.includes(part));
            })
            .slice(0, 12);
    }

    function openQuestionFromSearch(question) {
        if (!question) return;

        const task = getTask(question);
        const title = `搜索题目 · ${question.sourceId || (task && task.name) || "题库"}`;

        if (typeof window.showQuestionInventory === "function") {
            window.showQuestionInventory([question], title);
            return;
        }

        if (typeof window.startQuestionSession === "function") {
            window.startQuestionSession([question], title, "搜索结果");
        }
    }

    function renderSearchResults(query) {
        const box = document.getElementById("sg-search-results");
        if (!box) return;

        const keyword = normalizeSearchText(query);
        if (!keyword) {
            box.hidden = true;
            box.innerHTML = "";
            return;
        }

        const results = getSearchResults(keyword);
        if (!results.length) {
            box.innerHTML = `<div class="sg-search-empty">没有找到包含“${String(query).replace(/</g, "&lt;")}”的题目</div>`;
            box.hidden = false;
            return;
        }

        box.innerHTML = results.map((question, index) => {
            const task = getTask(question);
            const meta = [
                question.sourceId,
                task && `${task.category} · ${task.module}`,
                question.topic
            ].filter(Boolean);

            return `
                <button type="button" class="sg-search-result${index === 0 ? " is-active" : ""}" data-search-question-id="${question.id}">
                    <span class="sg-search-result-meta">${meta.map(item => `<span>${item}</span>`).join("<span>·</span>")}</span>
                    <span class="sg-search-result-title">${question.question || "未命名题目"}</span>
                </button>
            `;
        }).join("");

        box.querySelectorAll("[data-search-question-id]").forEach(button => {
            button.addEventListener("click", () => {
                const question = questions.find(item => item.id === button.dataset.searchQuestionId);
                openQuestionFromSearch(question);
                box.hidden = true;
            });
        });

        box.hidden = false;
    }

    function installSearch() {
        ensureBranding();
        const input = document.getElementById("sg-question-search");
        const box = document.getElementById("sg-search-results");
        if (!input || !box || input.dataset.ready === "1") return;

        input.dataset.ready = "1";
        input.addEventListener("input", () => renderSearchResults(input.value));
        input.addEventListener("focus", () => {
            if (input.value.trim()) renderSearchResults(input.value);
        });
        input.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                box.hidden = true;
                input.blur();
            }
            if (event.key === "Enter") {
                const first = box.querySelector("[data-search-question-id]");
                if (first) {
                    event.preventDefault();
                    first.click();
                }
            }
        });

        document.addEventListener("click", event => {
            const wrap = input.closest(".sg-search-wrap");
            if (wrap && !wrap.contains(event.target)) box.hidden = true;
        });
    }

    const baseRenderSummary = window.renderSummary;
    if (typeof baseRenderSummary === "function") {
        window.renderSummary = function (...args) {
            const result = baseRenderSummary(...args);
            updateAccuracyGauge();
            return result;
        };
    }

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function") {
        window.recordAnswer = function (...args) {
            const result = baseRecordAnswer(...args);
            updateAccuracyGauge();
            return result;
        };
    }

    ensureBranding();
    installSearch();
    updateAccuracyGauge();
})();
